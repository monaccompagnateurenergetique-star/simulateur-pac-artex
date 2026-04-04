import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
  addDoc,
  getDocs,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

export const TICKET_CATEGORIES = [
  { value: 'technique', label: 'Technique' },
  { value: 'facturation', label: 'Facturation' },
  { value: 'fonctionnalite', label: 'Demande de fonctionnalité' },
  { value: 'bug', label: 'Signalement de bug' },
  { value: 'autre', label: 'Autre' },
]

export const TICKET_PRIORITIES = [
  { value: 'basse', label: 'Basse', color: 'bg-gray-100 text-gray-700' },
  { value: 'normale', label: 'Normale', color: 'bg-blue-100 text-blue-700' },
  { value: 'haute', label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-700' },
]

export const TICKET_STATUSES = [
  { value: 'ouvert', label: 'Ouvert', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'en_cours', label: 'En cours', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'resolu', label: 'Résolu', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'ferme', label: 'Fermé', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
]

/**
 * useTickets — CRUD tickets + messages
 * Super admin voit tous les tickets, installateurs voient ceux de leur org
 */
export function useTickets() {
  const { user, userProfile } = useAuth()
  const { orgId, isSuperAdmin } = useRole()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  // Ecoute temps reel des tickets
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) {
      setTickets([])
      setLoading(false)
      return
    }

    let q
    if (isSuperAdmin()) {
      // Super admin voit tout
      q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'))
    } else if (orgId) {
      // Membres d'une org voient les tickets de leur org
      q = query(
        collection(db, 'tickets'),
        where('orgId', '==', orgId),
        orderBy('createdAt', 'desc')
      )
    } else {
      setTickets([])
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.warn('useTickets: erreur lecture:', err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, orgId])

  const createTicket = useCallback(
    async ({ subject, category, priority, message }) => {
      if (!user || !isFirebaseConfigured || !db) return null

      const ticketRef = doc(collection(db, 'tickets'))
      const ticket = {
        orgId: orgId || null,
        createdBy: user.uid,
        createdByName: userProfile
          ? [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ')
          : user.email,
        subject,
        category: category || 'autre',
        priority: priority || 'normale',
        status: 'ouvert',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(ticketRef, ticket)

      // Premier message
      if (message) {
        await addDoc(collection(db, 'tickets', ticketRef.id, 'messages'), {
          authorUid: user.uid,
          authorName: ticket.createdByName,
          text: message,
          isAdmin: false,
          createdAt: new Date().toISOString(),
        })
      }

      return { id: ticketRef.id, ...ticket }
    },
    [user, orgId, userProfile]
  )

  const updateTicketStatus = useCallback(
    async (ticketId, status) => {
      if (!isFirebaseConfigured || !db) return
      await setDoc(
        doc(db, 'tickets', ticketId),
        { status, updatedAt: new Date().toISOString() },
        { merge: true }
      )
    },
    []
  )

  const deleteTicket = useCallback(
    async (ticketId) => {
      if (!isFirebaseConfigured || !db) return
      await deleteDoc(doc(db, 'tickets', ticketId))
    },
    []
  )

  return {
    tickets,
    loading,
    createTicket,
    updateTicketStatus,
    deleteTicket,
  }
}

/**
 * useTicketMessages — Messages d'un ticket specifique
 */
export function useTicketMessages(ticketId) {
  const { user, userProfile } = useAuth()
  const { isSuperAdmin } = useRole()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ticketId || !isFirebaseConfigured || !db) {
      setMessages([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'tickets', ticketId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.warn('useTicketMessages: erreur:', err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [ticketId])

  const sendMessage = useCallback(
    async (text) => {
      if (!ticketId || !user || !isFirebaseConfigured || !db) return

      const authorName = userProfile
        ? [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ')
        : user.email

      await addDoc(collection(db, 'tickets', ticketId, 'messages'), {
        authorUid: user.uid,
        authorName,
        text,
        isAdmin: isSuperAdmin(),
        createdAt: new Date().toISOString(),
      })

      // Mettre a jour updatedAt du ticket
      await setDoc(
        doc(db, 'tickets', ticketId),
        { updatedAt: new Date().toISOString() },
        { merge: true }
      )
    },
    [ticketId, user, userProfile]
  )

  return { messages, loading, sendMessage }
}
