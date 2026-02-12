"use client";

import About from "@/components/About";
import BackToTop from "@/components/BackToTop";
import Calculator from "@/components/Calculator";
import Certificates from "@/components/Certificates";
import Delivery from "@/components/Delivery";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Modal from "@/components/Modal";
import Payment from "@/components/Payment";
import Portfolio from "@/components/Portfolio";
import Process from "@/components/Process";
import Science from "@/components/Science";
import ScrollProgress from "@/components/ScrollProgress";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import { useState } from "react";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <ScrollProgress />
      <Header onOpenModal={openModal} />
      <main>
        <Hero onOpenModal={openModal} />
        <Services />
        <Process />
        <Science onOpenModal={openModal} />
        <Delivery />
        <Payment />
        {/* <EquipmentShowcase /> */}
        <Calculator onOpenModal={openModal} />
        <About />
        <Certificates />
        <Portfolio />
        <Testimonials />
      </main>
      <Footer onOpenModal={openModal} />
      <Modal isOpen={modalOpen} onClose={closeModal} />
      <BackToTop />
    </>
  );
}
