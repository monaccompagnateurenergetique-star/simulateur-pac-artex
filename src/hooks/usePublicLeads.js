import { useCallback } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

/**
 * usePublicLeads — Capture de leads depuis l'espace public (pas besoin d'auth)
 * Ecrit dans public_leads/{id}
 */
export function usePublicLeads() {
  const submitLead = useCallback(
    async ({ orgId, slug, firstName, lastName, email, phone, address, postalCode, city, message, source }) => {
      if (!isFirebaseConfigured || !db) return null

      const leadData = {
        orgId: orgId || null,
        slug: slug || null,
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        phone: phone || '',
        address: address || '',
        postalCode: postalCode || '',
        city: city || '',
        message: message || '',
        source: source || 'minisite',
        status: 'nouveau',
        createdAt: new Date().toISOString(),
      }

      const ref = await addDoc(collection(db, 'public_leads'), leadData)
      return { id: ref.id, ...leadData }
    },
    []
  )

  return { submitLead }
}
