'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, CreditCard, Home, ShoppingCart, Utensils } from 'lucide-react'

export default function Component() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-2 flex items-center justify-center">
      <Card className="w-full max-w-[320px]">
        <CardHeader className="space-y-1 p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <CardTitle className="text-xl font-bold">ExpenseTracker</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Easily record and manage your daily expenses. Keep track of your spending habits in one place.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="subject" className="text-xs text-right">Subject</Label>
            <Select>
              <SelectTrigger id="subject" className="h-8 col-span-2">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="date" className="text-xs text-right">Date</Label>
            <div className="relative col-span-2">
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-8"
              />
              <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="amount" className="text-xs text-right">Amount</Label>
            <Input type="number" id="amount" placeholder="0.00" step="0.01" min="0" inputMode="decimal" className="h-8 col-span-2" />
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="category" className="text-xs text-right">Category</Label>
            <Select>
              <SelectTrigger id="category" className="h-8 col-span-2">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">
                  <div className="flex items-center">
                    <Utensils className="mr-2 h-3 w-3" />
                    <span>Food</span>
                  </div>
                </SelectItem>
                <SelectItem value="shopping">
                  <div className="flex items-center">
                    <ShoppingCart className="mr-2 h-3 w-3" />
                    <span>Shopping</span>
                  </div>
                </SelectItem>
                <SelectItem value="housing">
                  <div className="flex items-center">
                    <Home className="mr-2 h-3 w-3" />
                    <span>Housing</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="description" className="text-xs text-right">Description</Label>
            <Textarea id="description" placeholder="Brief description" className="h-16 resize-none col-span-2" />
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <Label className="text-xs text-right">Reimburse</Label>
            <RadioGroup defaultValue="no" className="flex col-span-2">
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="no" id="no" className="h-4 w-4" />
                <Label htmlFor="no" className="text-xs">No</Label>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                <RadioGroupItem value="yes" id="yes" className="h-4 w-4" />
                <Label htmlFor="yes" className="text-xs">Yes</Label>
              </div>
            </RadioGroup>
          </div>
          <Button className="w-full h-8 text-sm mt-2">Save Expense</Button>
        </CardContent>
      </Card>
    </div>
  )
}