'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, CreditCard, Home, ShoppingCart, Utensils } from 'lucide-react'

export default function Component() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-4 flex items-center justify-center">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center py-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">ExpenseTracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select>
                <SelectTrigger id="subject">
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
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input type="number" id="amount" placeholder="0.00" step="0.01" min="0" inputMode="decimal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">
                    <div className="flex items-center">
                      <Utensils className="mr-2 h-4 w-4" />
                      <span>Food</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="shopping">
                    <div className="flex items-center">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Shopping</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="housing">
                    <div className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Housing</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea id="description" placeholder="Enter a brief description" className="h-24" />
          </div>
          <div className="space-y-2">
            <Label>Reimburse</Label>
            <RadioGroup defaultValue="no" className="flex">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No</Label>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
            </RadioGroup>
          </div>
          <Button className="w-full">Save Expense</Button>
        </CardContent>
      </Card>
    </div>
  )
}