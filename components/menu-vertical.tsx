"use client";

import React from "react";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import Link from "next/link";

type MenuItem = {
  label: string;
  href: string;
  icon?: React.ElementType;
};

interface MenuVerticalProps {
  menuItems: MenuItem[];
  color?: string;
  skew?: number;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}

const MotionLink = motion.create(Link);

export const MenuVertical = ({
  menuItems = [],
  color = "#ff6900",
  skew = 0,
  onNavigate,
  isCollapsed = false,
}: MenuVerticalProps) => {
  return (
    <div className={`flex w-full flex-col gap-4 py-4 ${isCollapsed ? 'px-2' : 'px-6 md:px-10'}`}>
      {menuItems.map((item, index) => (
        <MotionLink
          key={`${item.href}-${index}`}
          href={item.href}
          onClick={onNavigate}
          className={`group/nav flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} cursor-pointer text-zinc-900 dark:text-zinc-50 no-underline`}
          initial="initial"
          whileHover="hover"
          whileTap="hover"
          title={isCollapsed ? item.label : undefined}
        >
          {item.icon ? (
            <motion.div
              variants={{
                initial: { scale: 1, color: "inherit" },
                hover: { scale: 1.1, color: color },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="z-10 shrink-0"
            >
              <item.icon className={isCollapsed ? "size-6" : "size-8"} />
            </motion.div>
          ) : (
            <motion.div
              variants={{
                initial: { x: "-100%", color: "inherit", opacity: 0 },
                hover: { x: 0, color, opacity: 1 },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="z-0"
            >
              <ArrowRight strokeWidth={3} className="size-8 md:size-10" />
            </motion.div>
          )}

          {!isCollapsed && (
            <motion.span
              variants={{
                initial: { x: item.icon ? 0 : -30, color: "inherit" },
                hover: { x: 0, color, skewX: skew },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="font-semibold text-2xl md:text-3xl whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </MotionLink>
      ))}
    </div>
  );
};
