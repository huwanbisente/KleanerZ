import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <Component {...pageProps} />
      </CurrencyProvider>
    </ThemeProvider>
  );
}
