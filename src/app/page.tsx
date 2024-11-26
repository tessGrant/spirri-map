import Image from "next/image";
import styles from "./page.module.css";
import { EVChargingMap } from "@/components/EvChargingMap";

export default function Home() {
  return (
    <div>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <EVChargingMap />
      </main>
    </div>
  );
}
