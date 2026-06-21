import { Link } from "react-router-dom";
import { type Offer, categoryIcons } from "@/data/offers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categoryColorMap: Record<string, string> = {
  Coffee: "bg-category-coffee/15 text-category-coffee",
  Food: "bg-category-food/15 text-category-food",
  Fashion: "bg-category-fashion/15 text-category-fashion",
  Technology: "bg-category-technology/15 text-category-technology",
};

const OfferCard = ({ offer }: { offer: Offer }) => {
  return (
    <div className="group flex flex-col rounded-lg border bg-card p-4 transition-shadow hover:shadow-md animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="secondary" className={categoryColorMap[offer.category]}>
          {categoryIcons[offer.category]} {offer.category}
        </Badge>
        <span className="font-display text-lg font-bold text-primary">
          {offer.discount}% OFF
        </span>
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">
        {offer.storeName}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{offer.title}</p>
      <div className="mt-auto pt-4">
        <Link to={`/offers/${offer.id}`}>
          <Button size="sm" className="w-full">
            View Offer
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OfferCard;
