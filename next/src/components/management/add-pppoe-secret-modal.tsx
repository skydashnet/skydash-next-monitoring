"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "@/components/motion";
import { X, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddPppoeSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPppoeSecretModal = ({
  isOpen,
  onClose,
  onSuccess,
}: AddPppoeSecretModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    profile: "",
    localAddress: "",
    remoteAddress: "",
  });
  const [profiles, setProfiles] = useState<string[]>([]);
  const [isAutoIp, setIsAutoIp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (isOpen) {
      const fetchProfiles = async () => {
        try {
          const res = await fetch(`${apiUrl}/api/pppoe/profiles`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Gagal memuat profil");
          const data = await res.json();
          setProfiles(data);
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, profile: data[0] }));
          }
        } catch (err: any) {
          setError(err.message);
        }
      };
      fetchProfiles();
    }
  }, [isOpen]);

  const getNextIpForProfile = useCallback(
    async (profileName: string) => {
      if (!profileName || !isAutoIp) return;
      setError("");
      try {
        const response = await fetch(`${apiUrl}/api/pppoe/next-ip?profile=${encodeURIComponent(
            profileName
          )}`,
          { credentials: "include" }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setFormData((prev) => ({
          ...prev,
          localAddress: data.localAddress,
          remoteAddress: data.remoteAddress,
        }));
      } catch (error: any) {
        setError(error.message);
      }
    },
    [isAutoIp]
  );

  useEffect(() => {
    if (formData.profile) {
      getNextIpForProfile(formData.profile);
    }
  }, [formData.profile, getNextIpForProfile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/pppoe/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, service: "pppoe" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal menambah secret");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-lg border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <header className="flex justify-between items-center p-4 border-b border-border">
                <h2 className="text-xl font-bold">Tambah Secret PPPoE</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-secondary"
                >
                  <X size={20} />
                </button>
              </header>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Nama Pengguna
                    </label>
                    <input
                      type="text"
                      name="name"
                      onChange={handleChange}
                      className="w-full p-2 rounded-md bg-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      onChange={handleChange}
                      className="w-full p-2 rounded-md bg-input"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">
                    Profil Kecepatan
                  </label>
                  <select
                    name="profile"
                    value={formData.profile}
                    onChange={handleChange}
                    className="w-full p-2 rounded-md bg-input"
                    required
                  >
                    {profiles.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAutoIp}
                      onChange={() => setIsAutoIp(!isAutoIp)}
                      className="w-4 h-4 rounded text-primary bg-input"
                    />
                    <span className="text-sm font-medium">
                      Alokasikan IP Otomatis
                    </span>
                    <Zap size={14} className="text-yellow-500" />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Local Address
                    </label>
                    <input
                      type="text"
                      name="localAddress"
                      value={formData.localAddress}
                      onChange={handleChange}
                      placeholder="Otomatis"
                      disabled={isAutoIp}
                      className="w-full p-2 rounded-md bg-input disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Remote Address
                    </label>
                    <input
                      type="text"
                      name="remoteAddress"
                      value={formData.remoteAddress}
                      onChange={handleChange}
                      placeholder="Otomatis"
                      disabled={isAutoIp}
                      className="w-full p-2 rounded-md bg-input disabled:opacity-50"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-center text-destructive p-2 bg-destructive/10 rounded-md">
                    {error}
                  </p>
                )}
              </div>
              <footer className="flex justify-end gap-4 p-4 bg-secondary/50 rounded-b-2xl">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                  Simpan Secret
                </Button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddPppoeSecretModal;
