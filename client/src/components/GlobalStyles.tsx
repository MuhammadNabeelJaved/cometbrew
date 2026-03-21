/**
 * Global Styles and Animations
 * Defines custom animations for infinite scroll and other effects
 */
import React from 'react';

export function GlobalStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      :root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --card: 0 0% 100%;
        --card-foreground: 222.2 84% 4.9%;
        --popover: 0 0% 100%;
        --popover-foreground: 222.2 84% 4.9%;
        --primary: 262.1 83.3% 57.8%;
        --primary-foreground: 210 40% 98%;
        --secondary: 221.2 83.2% 53.3%;
        --secondary-foreground: 210 40% 98%;
        --muted: 210 40% 96.1%;
        --muted-foreground: 215.4 16.3% 46.9%;
        --accent: 217 91% 60%;
        --accent-foreground: 222.2 47.4% 11.2%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 210 40% 98%;
        --border: 214.3 31.8% 85%;
        --input: 214.3 31.8% 91.4%;
        --ring: 262.1 83.3% 57.8%;
        --radius: 0.75rem;
        --spotlight-color: 0, 0, 0;
      }
 
      .dark {
        --background: 240 10% 3.9%;
        --foreground: 210 40% 98%;
        --card: 240 10% 3.9%;
        --card-foreground: 210 40% 98%;
        --popover: 240 10% 3.9%;
        --popover-foreground: 210 40% 98%;
        --primary: 263.4 70% 50.4%;
        --primary-foreground: 210 40% 98%;
        --secondary: 217.2 91.2% 59.8%;
        --secondary-foreground: 222.2 47.4% 11.2%;
        --muted: 217.2 32.6% 17.5%;
        --muted-foreground: 215 20.2% 65.1%;
        --accent: 217.2 32.6% 17.5%;
        --accent-foreground: 210 40% 98%;
        --destructive: 0 62.8% 30.6%;
        --destructive-foreground: 210 40% 98%;
        --border: 217.2 32.6% 17.5%;
        --input: 217.2 32.6% 17.5%;
        --ring: 263.4 70% 50.4%;
        --spotlight-color: 255, 255, 255;
      }
      
      * {
        border-color: hsl(var(--border));
      }
      
      body {
        background-color: hsl(var(--background));
        color: hsl(var(--foreground));
      }

      /* Custom Animations */
      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-33.33%); } /* Loop point for 3 copies */
      }
      @keyframes scroll-reverse {
        0% { transform: translateX(-33.33%); }
        100% { transform: translateX(0); }
      }
      @keyframes shine {
        0% { transform: translateX(-100%) skewX(-12deg); }
        100% { transform: translateX(200%) skewX(-12deg); }
      }
      @keyframes blob {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
        100% { transform: translate(0px, 0px) scale(1); }
      }
      
      .animate-scroll {
        animation: scroll 30s linear infinite;
      }
      .animate-scroll-reverse {
        animation: scroll-reverse 30s linear infinite;
      }
      .animate-scroll-vertical {
        animation: scroll-vertical 40s linear infinite;
      }
      .animate-scroll-vertical-reverse {
        animation: scroll-vertical 40s linear infinite reverse;
      }
      @keyframes scroll-vertical {
        0% { transform: translateY(0); }
        100% { transform: translateY(-33.33%); }
      }

      .animate-shine {
        animation: shine 1.5s ease-in-out infinite;
      }
      .animate-blob {
        animation: blob 7s infinite;
      }
      .pause-on-hover:hover {
        animation-play-state: paused;
      }
      
      /* Utilities */
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      /* Glassmorphism Utilities */
      .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    `}} />
  );
}