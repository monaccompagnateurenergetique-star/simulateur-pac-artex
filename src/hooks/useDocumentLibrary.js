import { useMemo, useCallback } from 'react'
import { useOrgDoc } from './useOrgCollection'
import { DOCUMENT_LIBRARY } from '../lib/constants/documentLibrary'

/**
 * useDocumentLibrary — Bibliotheque de documents personnalisable
 *
 * Architecture :
 *  - Defaults : DOCUMENT_LIBRARY (constants/documentLibrary.js) — 23 docs
 *  - Surcharges Firestore : organizations/{orgId}/settings/documentLibrary
 *    Stocke uniquement les modifs (overrides + disabled + custom)
 *
 * Le hook merge les defaults avec les surcharges et expose une API simple.
 */

const STORAGE_KEY = 'artex360-document-library'

const DEFAULT_LIB_STATE = {
  // ids des documents par defaut desactives
  disabled: [],
  // surcharges sur les documents par defaut : { [docId]: { label?, description?, phase?, tags?, mandatory?, ... } }
  overrides: {},
  // documents personnalises ajoutes par l'utilisateur
  custom: [],
}

export function useDocumentLibrary() {
  const { data: rawState, save, synced, isOnline } = useOrgDoc(
    'settings/documentLibrary',
    STORAGE_KEY,
    DEFAULT_LIB_STATE
  )

  // Merge defaults + overrides + custom
  const documents = useMemo(() => {
    const state = {
      disabled: rawState?.disabled || [],
      overrides: rawState?.overrides || {},
      custom: rawState?.custom || [],
    }

    // 1. Defaults avec overrides appliques
    const merged = DOCUMENT_LIBRARY.map((doc) => {
      const override = state.overrides[doc.id] || {}
      return {
        ...doc,
        ...override,
        enabled: !state.disabled.includes(doc.id),
        isDefault: true,
      }
    })

    // 2. Custom docs (toujours actives par defaut)
    const customs = state.custom.map((doc) => ({
      ...doc,
      enabled: doc.enabled !== false,
      isDefault: false,
    }))

    return [...merged, ...customs]
  }, [rawState])

  /** Active / desactive un document (par defaut ou custom) */
  const toggleEnabled = useCallback((docId) => {
    const current = {
      disabled: rawState?.disabled || [],
      overrides: rawState?.overrides || {},
      custom: rawState?.custom || [],
    }

    // Doc default ?
    const isDefault = DOCUMENT_LIBRARY.some((d) => d.id === docId)
    if (isDefault) {
      const isDisabled = current.disabled.includes(docId)
      const newDisabled = isDisabled
        ? current.disabled.filter((id) => id !== docId)
        : [...current.disabled, docId]
      save({ ...current, disabled: newDisabled })
    } else {
      // Custom : flip enabled
      const newCustom = current.custom.map((d) =>
        d.id === docId ? { ...d, enabled: d.enabled === false ? true : false } : d
      )
      save({ ...current, custom: newCustom })
    }
  }, [rawState, save])

  /** Edite un document (default ou custom) */
  const updateDocument = useCallback((docId, updates) => {
    const current = {
      disabled: rawState?.disabled || [],
      overrides: rawState?.overrides || {},
      custom: rawState?.custom || [],
    }

    const isDefault = DOCUMENT_LIBRARY.some((d) => d.id === docId)
    if (isDefault) {
      // Stocke uniquement les diffs vs default
      const original = DOCUMENT_LIBRARY.find((d) => d.id === docId)
      const newOverride = {}
      Object.entries(updates).forEach(([key, value]) => {
        if (JSON.stringify(value) !== JSON.stringify(original[key])) {
          newOverride[key] = value
        }
      })
      const newOverrides = { ...current.overrides }
      if (Object.keys(newOverride).length === 0) {
        delete newOverrides[docId]
      } else {
        newOverrides[docId] = { ...(current.overrides[docId] || {}), ...newOverride }
      }
      save({ ...current, overrides: newOverrides })
    } else {
      // Custom : merge directement
      const newCustom = current.custom.map((d) =>
        d.id === docId ? { ...d, ...updates } : d
      )
      save({ ...current, custom: newCustom })
    }
  }, [rawState, save])

  /** Ajoute un nouveau document custom */
  const addDocument = useCallback((newDoc) => {
    const current = {
      disabled: rawState?.disabled || [],
      overrides: rawState?.overrides || {},
      custom: rawState?.custom || [],
    }

    // Genere un id unique
    const slug = (newDoc.label || 'document')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) || 'document'
    let id = `custom_${slug}`
    let i = 1
    while (current.custom.some((d) => d.id === id) || DOCUMENT_LIBRARY.some((d) => d.id === id)) {
      id = `custom_${slug}_${i++}`
    }

    const doc = {
      id,
      label: newDoc.label || 'Nouveau document',
      description: newDoc.description || '',
      phase: newDoc.phase || 'avant',
      tags: newDoc.tags || ['CEE'],
      source: newDoc.source || 'client',
      mandatory: newDoc.mandatory !== false,
      precarity: newDoc.precarity || null,
      expirable: newDoc.expirable === true,
      enabled: true,
    }

    save({ ...current, custom: [...current.custom, doc] })
    return id
  }, [rawState, save])

  /** Supprime un document custom (les defaults ne peuvent etre supprimes, juste desactives) */
  const removeDocument = useCallback((docId) => {
    const current = {
      disabled: rawState?.disabled || [],
      overrides: rawState?.overrides || {},
      custom: rawState?.custom || [],
    }
    const isDefault = DOCUMENT_LIBRARY.some((d) => d.id === docId)
    if (isDefault) return // on ne supprime pas les defaults
    save({ ...current, custom: current.custom.filter((d) => d.id !== docId) })
  }, [rawState, save])

  /** Reset complet : retire tous les overrides et custom */
  const resetLibrary = useCallback(() => {
    save(DEFAULT_LIB_STATE)
  }, [save])

  return {
    documents,           // tableau merged complet, avec champ .enabled et .isDefault
    toggleEnabled,
    updateDocument,
    addDocument,
    removeDocument,
    resetLibrary,
    synced,
    isOnline,
  }
}
