"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Process from "@/components/Process";
import Science from "@/components/Science";
import Calculator from "@/components/Calculator";
import About from "@/components/About";
import Certificates from "@/components/Certificates";
import Portfolio from "@/components/Portfolio";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Partners from "@/components/Partners";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import BackToTop from "@/components/BackToTop";

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
        <Process />
        <Science />
        <Calculator onOpenModal={openModal} />
        <About />
        <Certificates />
        <Portfolio />
        <Testimonials />
        <FAQ />
        <Partners />
      </main>
      <Footer onOpenModal={openModal} />
      <Modal isOpen={modalOpen} onClose={closeModal} />
      <BackToTop />
    </>
  );
}
