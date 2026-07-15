"use client";

import { CreditCard, Banknote } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type PaymentMethod = "Razorpay" | "COD";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <Card className="border-zinc-800 bg-gradient-to-b from-[#0b0d18] to-black p-5 shadow-[0_0_40px_rgba(34,197,94,0.05)]">
      <div className="mb-5">
        <h3 className="font-mono text-xl font-semibold text-white">
          Payment Method
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Select how you'd like to complete your order
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(val) =>
          onChange(val as PaymentMethod)
        }
        className="space-y-3"
      >
        {/* Razorpay */}
        <Label
          htmlFor="razorpay"
          className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
            value === "Razorpay"
              ? "border-lime-500 bg-lime-500/10"
              : "border-zinc-800 bg-black/30 hover:border-zinc-700"
          }`}
        >
          <RadioGroupItem
            value="Razorpay"
            id="razorpay"
            className="mt-1 border-zinc-600 text-lime-500"
          />

          <CreditCard className="mt-0.5 h-5 w-5 text-lime-500" />

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">
                Razorpay
              </span>

              <span className="rounded-md border border-lime-500/20 bg-lime-500/10 px-2 py-1 text-[10px] font-medium text-lime-400">
                Recommended
              </span>
            </div>

            <p className="mt-1 text-xs text-zinc-400">
              Pay the full amount securely using UPI, Cards,
              Wallets, or Net Banking.
            </p>
          </div>
        </Label>

        {/* COD */}
        <Label
          htmlFor="cod"
          className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
            value === "COD"
              ? "border-lime-500 bg-lime-500/10"
              : "border-zinc-800 bg-black/30 hover:border-zinc-700"
          }`}
        >
          <RadioGroupItem
            value="COD"
            id="cod"
            className="mt-1 border-zinc-600 text-lime-500"
          />

          <Banknote className="mt-0.5 h-5 w-5 text-lime-500" />

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                Cash on Delivery
              </span>

              <span className="rounded-md border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[10px] font-medium text-yellow-400">
                50% Advance
              </span>
            </div>

            <p className="mt-1 text-xs text-zinc-400">
              Pay 50% now and the remaining amount when your
              order is delivered.
            </p>
          </div>
        </Label>
      </RadioGroup>
    </Card>
  );
}