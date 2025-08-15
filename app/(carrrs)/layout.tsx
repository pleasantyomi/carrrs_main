import { CarrrsNavigation} from "@/components/carrrs/navigation";

export default function CarrrsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CarrrsNavigation />
      {children}
    </div>
  );
}