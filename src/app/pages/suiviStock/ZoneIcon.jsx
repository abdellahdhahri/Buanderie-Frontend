import React from "react";
import { BedDouble, Building2, Layers, PackageOpen, ShoppingBasket, TriangleAlert, Users, WashingMachine, Boxes } from "lucide-react";

const ICONS = {
  OFFICE: Building2,
  STOCK_NON_RANGE: PackageOpen,
  CHAMBRES: BedDouble,
  PORTEURS: Users,
  A_RANGER: Layers,
  SALE: ShoppingBasket,
  CIRCUIT_BUANDERIE: WashingMachine,
  PERTES: TriangleAlert,
};

export default function ZoneIcon({ zone, size = 18 }) {
  const Icon = ICONS[zone] || Boxes;
  return <Icon size={size} />;
}
