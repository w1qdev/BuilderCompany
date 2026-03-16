"use client";

import CatalogPageContent from "@/components/CatalogPage";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import BackToTop from "@/components/BackToTop";
import { useCallback, useState } from "react";

type ModalInitialValues = {
  equipmentTypeId?: number;
  equipmentTypeName?: string;
  equipmentSubTypeName?: string;
  service?: string;
};

export default function CatalogPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialValues, setModalInitialValues] = useState<ModalInitialValues | undefined>();
  const [catalogMode, setCatalogMode] = useState(false);

  const openModal = () => { setModalInitialValues(undefined); setCatalogMode(false); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setModalInitialValues(undefined); setCatalogMode(false); };

  const handleCatalogOrder = useCallback((item: { id: number; name: string; subTypeName?: string }) => {
    setModalInitialValues({
      equipmentTypeId: item.id || undefined,
      equipmentTypeName: item.name,
      equipmentSubTypeName: item.subTypeName || undefined,
      service: "Поверка СИ",
    });
    setCatalogMode(true);
    setModalOpen(true);
  }, []);

  return (
    <>
      <Header onOpenModal={openModal} />
      <main className="pt-28 pb-20">
        <CatalogPageContent onOrderClick={handleCatalogOrder} />
      </main>
      <Footer onOpenModal={openModal} />
      <Modal isOpen={modalOpen} onClose={closeModal} initialValues={modalInitialValues} catalogMode={catalogMode} />
      <BackToTop />
    </>
  );
}
