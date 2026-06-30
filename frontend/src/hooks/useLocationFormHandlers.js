import { useCallback, useState } from "react";

export function useLocationFormHandlers(initialForm) {
  const [form, setForm] = useState(initialForm);
  const [snapshot, setSnapshot] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const patch = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const patchContact = useCallback((index, key, value) => {
    setForm((prev) => {
      const contacts = [...(prev.contacts || [])];
      contacts[index] = { ...contacts[index], [key]: value };
      return { ...prev, contacts };
    });
  }, []);

  const addContact = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      contacts: [
        ...(prev.contacts || []),
        { name: "", mobile: "", email: "", designation: "" },
      ],
    }));
  }, []);

  const removeContact = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      contacts: (prev.contacts || []).filter((_, i) => i !== index),
    }));
  }, []);

  const clearGstinError = useCallback(() => {
    setErrors((prev) => {
      if (!prev.gstin) return prev;
      const next = { ...prev };
      delete next.gstin;
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setForm(snapshot);
    setErrors({});
  }, [snapshot]);

  const replaceForm = useCallback((next) => {
    setForm(next);
    setSnapshot(next);
    setErrors({});
  }, []);

  return {
    form,
    snapshot,
    errors,
    setErrors,
    patch,
    patchContact,
    addContact,
    removeContact,
    clearGstinError,
    resetForm,
    replaceForm,
  };
}
