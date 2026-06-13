import { Car, AlertTriangle, CheckCircle2, Wrench, Navigation, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Car as CarType, CarStatus } from "@/features/cars/cars-api";

interface VehicleAssetCardProps {
  car: CarType;
  photoUrl: string;
}

export function VehicleAssetCard({ car, photoUrl }: VehicleAssetCardProps) {
  const statusConfig: Record<CarStatus, { color: string; bg: string; icon: any; label: string }> = {
    AVAILABLE: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, label: "READY" },
    RENTED: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", icon: Navigation, label: "DEPLOYED" },
    MAINTENANCE: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", icon: Wrench, label: "SERVICE" },
    INACTIVE: { color: "text-slate-500", bg: "bg-slate-500/10 border-slate-500/20", icon: AlertTriangle, label: "OFFLINE" }
  };

  const config = statusConfig[car.status];
  const Icon = config.icon;

  // Simple alert logic for UI demonstration
  const today = new Date();
  const insuranceDate = car.insuranceExpiryDate ? new Date(car.insuranceExpiryDate) : null;
  const techDate = car.technicalVisitExpiryDate ? new Date(car.technicalVisitExpiryDate) : null;
  
  const daysToInsurance = insuranceDate ? Math.ceil((insuranceDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : Infinity;
  const daysToTech = techDate ? Math.ceil((techDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : Infinity;
  
  const hasAlert = daysToInsurance < 30 || daysToTech < 30;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card group relative flex flex-col overflow-hidden rounded-xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:border-border/80"
    >
      <Link to={`/cars/${car.id}`} className="absolute inset-0 z-10" aria-label={`View ${car.brand} ${car.model}`} />
      
      {/* Premium Image Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
        <img
          src={photoUrl}
          alt={`${car.brand} ${car.model}`}
          className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute left-3 top-3">
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-md", config.bg)}>
            <Icon className={cn("h-3 w-3", config.color)} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>{config.label}</span>
          </div>
        </div>

        {hasAlert && (
          <div className="absolute right-3 top-3">
             <div className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/20 px-2.5 py-1 backdrop-blur-md">
               <AlertTriangle className="h-3 w-3 text-destructive" />
             </div>
          </div>
        )}
      </div>

      <div className="relative z-20 -mt-6 flex flex-1 flex-col px-4 pb-4">
        {/* Registration Plate Style */}
        <div className="mb-3 w-fit rounded bg-white px-2 py-0.5 text-xs font-bold text-black ring-1 ring-black/10 shadow-sm">
          {car.registrationNumber}
        </div>
        
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight text-foreground line-clamp-1">{car.brand} {car.model}</h3>
        </div>
        
        <div className="mb-4 text-xs text-muted-foreground">{car.year} • {car.mileage.toLocaleString("fr-FR")} km</div>
        
        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border/50 pt-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Price/Day</div>
            <div className="text-sm font-bold text-foreground">{Number(car.dailyPrice).toLocaleString("fr-FR")} MAD</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Insurance</div>
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              {daysToInsurance < 30 ? (
                <span className="text-destructive font-bold">{daysToInsurance} days</span>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-muted-foreground">Valid</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
