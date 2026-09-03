"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Box, ChartColumnIncreasing, Handbag, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatisticItem = {
  title: string;
  subtitle: string;
  cardIcon: LucideIcon;
  /** Small print under the figure. Defaults to the block's "Last 7 days". */
  caption?: string;
  /** Both omitted together when there is no trend to state. Inventing one to
   * fill the slot would put a fabricated percentage next to a real revenue
   * figure, which is worse than a card with no badge. */
  badgeColor?: string;
  statusValue?: string;
};

/**
 * Takes `items` so the same block can front real data; without them it renders
 * the original demo figures unchanged, which is what /statistics-02 shows.
 */
export default function Statistic({ items }: { items?: StatisticItem[] }) {
  const demo: StatisticItem[] = [
    {
      title: "Orders",
      subtitle: "5868",
      cardIcon: Handbag,
      badgeColor: "bg-teal-400/10",
      statusValue: "+18%",
    },
    {
      title: "Sales",
      subtitle: "$96,850",
      cardIcon: Box,
      badgeColor: "bg-orange-400/10",
      statusValue: "-5%",
    },
    {
      title: "Profit",
      subtitle: "$82,906",
      cardIcon: ChartColumnIncreasing,
      badgeColor: "bg-teal-400/10",
      statusValue: "+18%",
    },
    {
      title: "Expense",
      subtitle: "$14,653",
      cardIcon: Star,
      badgeColor: "bg-teal-400/10",
      statusValue: "+18%",
    },
  ];

  const EcommerceActions = items ?? demo;

  return (
    <div className={cn(items ? "w-full" : "lg:py-20 sm:py-16 py-8")}>
      <div className={cn("w-full", items ? "" : "max-w-7xl mx-auto px-4")}>
        <Card className="p-0 shadow-xs">
          {/* items-center is the block's own alignment and is kept for the demo,
              where all four cards carry a badge and so share a height. Real
              data does not: a card without a trend is shorter, and centring it
              leaves the figures on a ragged baseline and the dividers short of
              the card edges. */}
          <CardContent
            className={cn(
              "flex w-full lg:flex-nowrap flex-wrap px-0",
              items ? "items-stretch" : "items-center",
            )}
          >
            {EcommerceActions.map((item, index) => {
              return (
                <div
                  className="lg:w-3/12 md:w-6/12 w-full border-border border-b last:border-b-0 md:border-e md:even:border-e-0 md:nth-[n+3]:border-b-0 lg:border-b-0 lg:even:border-e lg:last:border-e-0"
                  key={index}
                >
                  <div className="p-6 flex items-start justify-between">
                    <div className="flex flex-col gap-4">
                      <p className="text-base font-medium text-card-foreground">
                        {item.title}
                      </p>
                      <div>
                        <p className="text-2xl font-medium text-card-foreground">
                          {item.subtitle}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {item.caption ?? "Last 7 days"}
                          </p>
                          {item.statusValue && (
                            <Badge
                              className={cn(
                                "font-normal text-muted-foreground",
                                item.badgeColor,
                              )}
                            >
                              {item.statusValue}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* icon */}
                    <div className="p-3 rounded-full outline">
                      <item.cardIcon size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
