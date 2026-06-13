import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-provider";
import { deleteCar, getCarPhotoObjectUrl, listCars, setCarStatus, type Car, type CarStatus } from "@/features/cars/cars-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthUser, Permission } from "@/types/auth";
import { VehicleAssetCard } from "@/components/fleet-ui/VehicleAssetCard";
import { EmptyCommandState } from "@/components/fleet-ui/EmptyCommandState";
import { SkeletonCommandPanel } from "@/components/fleet-ui/SkeletonCommandPanel";
import { motion } from "framer-motion";

const placeholder = "https://placehold.co/800x500?text=Auto";

function hasPermission(user: AuthUser | null, permission: Permission) {
  if (user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_ADMIN") return true;
  return Boolean(user?.permissions.includes(permission));
}

export function CarsPage() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const canCreate = hasPermission(user, "cars:create");

  async function load() {
    try {
      setIsLoading(true);
      setCars(await listCars({ ...(statusFilter ? { status: statusFilter } : {}) }));
    } catch (error) {
      toast.error("Chargement impossible", { description: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter]);

  useEffect(() => {
    const ownedUrls: string[] = [];
    let cancelled = false;
    async function loadPrimaryPhotos() {
      const entries = await Promise.all(
        cars.map(async (car) => {
          const photo = car.photos.find((item) => item.isPrimary) ?? car.photos[0];
          if (!photo) return [car.id, placeholder] as const;
          try {
            const url = await getCarPhotoObjectUrl(photo);
            if (photo.storageKey) ownedUrls.push(url);
            return [car.id, url] as const;
          } catch {
            return [car.id, placeholder] as const;
          }
        })
      );
      if (!cancelled) setPhotoUrls(Object.fromEntries(entries));
    }
    void loadPrimaryPhotos();
    return () => {
      cancelled = true;
      ownedUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [cars]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-widest text-foreground uppercase">
            Fleet Assets
          </h1>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {cars.length} Vehicles in Registry
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select 
              className="h-10 appearance-none rounded-md border border-border/50 bg-secondary/50 pl-9 pr-8 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" 
              aria-label="Filter status" 
              value={statusFilter} 
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Deployed</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          
          {canCreate && (
            <Link 
              to="/cars/new" 
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Deploy Asset
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonCommandPanel className="h-[320px]" />
          <SkeletonCommandPanel className="h-[320px]" />
          <SkeletonCommandPanel className="h-[320px]" />
          <SkeletonCommandPanel className="h-[320px]" />
        </div>
      ) : cars.length === 0 ? (
        <EmptyCommandState 
          title="No Vehicles Found" 
          description="Register your first fleet asset to begin command and control." 
        />
      ) : (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {cars.map((car) => (
            <motion.div key={car.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 }}}>
              <VehicleAssetCard 
                car={car} 
                photoUrl={photoUrls[car.id] ?? placeholder} 
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
