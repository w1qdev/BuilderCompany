"use client";

import About from "@/components/About";
import CatalogPageContent from "@/components/CatalogPage";
import DashboardShowcase from "@/components/DashboardShowcase";
import BackToTop from "@/components/BackToTop";
import Calculator from "@/components/Calculator";
import Delivery from "@/components/Delivery";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Modal from "@/components/Modal";
import Payment from "@/components/Payment";
import Process from "@/components/Process";
import Science from "@/components/Science";
import ScrollProgress from "@/components/ScrollProgress";
import Services from "@/components/Services";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

const Portfolio = dynamic(() => import("@/components/Portfolio"), {
  ssr: false,
});
const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  ssr: false,
});

type ModalInitialValues = {
  equipmentTypeId?: number;
  equipmentTypeName?: string;
  equipmentSubTypeName?: string;
  service?: string;
};

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialValues, setModalInitialValues] = useState<
    ModalInitialValues | undefined
  >();
  const [catalogMode, setCatalogMode] = useState(false);

  const openModal = () => {
    setModalInitialValues(undefined);
    setCatalogMode(false);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalInitialValues(undefined);
    setCatalogMode(false);
  };

  const handleCatalogOrder = useCallback(
    (item: { id: number; name: string; subTypeName?: string }) => {
      setModalInitialValues({
        equipmentTypeId: item.id || undefined,
        equipmentTypeName: item.name,
        equipmentSubTypeName: item.subTypeName || undefined,
        service: "Поверка СИ",
      });
      setCatalogMode(true);
      setModalOpen(true);
    },
    [],
  );

  return (
    <>
      <ScrollProgress />
      <Header onOpenModal={openModal} />
      <main>
        <Hero onOpenModal={openModal} />
        <Services onOpenModal={openModal} />
        {/*<section id="catalog" className="py-20 sm:py-28 bg-white dark:bg-dark">
          <CatalogPageContent onOrderClick={handleCatalogOrder} />
        </section>*/}
        <Process />
        <Science onOpenModal={openModal} />
        <Delivery />
        <Payment />
        {/* <EquipmentShowcase /> */}
        <Calculator onOpenModal={openModal} />
        <DashboardShowcase />
        <About />
        <Portfolio />
        <Testimonials />
      </main>
      <Footer onOpenModal={openModal} />
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        initialValues={modalInitialValues}
        catalogMode={catalogMode}
      />
      <BackToTop />
    </>
  );
}
