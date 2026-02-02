"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Calculator from "@/components/Calculator";
import Services from "@/components/Services";
import About from "@/components/About";
import Partners from "@/components/Partners";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <>
      <Header onOpenModal={openModal} />
      <main>
        <Hero onOpenModal={openModal} />
        <Services />
        <Calculator onOpenModal={openModal} />
        <About />
        <Partners />
      </main>
      <Footer onOpenModal={openModal} />
      <Modal isOpen={modalOpen} onClose={closeModal} />
    </>
  );
}
