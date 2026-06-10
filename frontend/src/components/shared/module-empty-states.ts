import { Building2, CalendarClock, Car, Users } from "lucide-react";

export const moduleEmptyStates = {
  agencies: {
    icon: Building2,
    title: "Aucune agence",
    description: "Les futures agences apparaitront ici avec leur statut, plan et activite recente."
  },
  cars: {
    icon: Car,
    title: "Aucune voiture",
    description: "Le parc automobile sera liste ici quand le module voitures sera active."
  },
  clients: {
    icon: Users,
    title: "Aucun client",
    description: "Les profils clients et historiques de location seront centralises dans cette vue."
  },
  reservations: {
    icon: CalendarClock,
    title: "Aucune reservation",
    description: "Les reservations a venir, en cours et terminees utiliseront cette fondation UI."
  }
} as const;
