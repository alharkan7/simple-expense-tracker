'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Utensils,
  ShoppingBag,
  ShoppingBasket,
  Baby,
  Bus,
  Book,
  Donut,
  Tv,
  Gift,
  Users,
  Heart,
  DollarSign,
  FileText,
  Home,
  MoreHorizontal,
  ChartArea,
  Wallet
} from 'lucide-react';



export default function Component() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-4 flex items-center justify-center">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center py-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Expense Tracker</CardTitle>
          <p className="text-sm text-gray-500">Created by <a href="https://x.com/alhrkn" target="_blank" rel="noopener noreferrer">@alhrkn</a></p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select required>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="al-personal"><b>Al</b> (Personal)</SelectItem>
                  <SelectItem value="nurin-personal"><b>Nurin</b> (Personal)</SelectItem>
                  <SelectItem value="al-family"><b>Al</b> (Family)</SelectItem>
                  <SelectItem value="nurin-family"><b>Nurin</b> (Family)</SelectItem>
                  <SelectItem value="al-lainnya"><b>Al</b> (Lainnya)</SelectItem>
                  <SelectItem value="nurin-lainnya"><b>Nurin</b> (Lainnya)</SelectItem>
                  <SelectItem value="al-nurin"><b>Al & Nurin</b></SelectItem>
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
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input type="number" id="amount" placeholder="0" step="1000" min="0" inputMode="decimal" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foodAndBeverages">
                    <div className="flex items-center">
                      <Utensils className="mr-2 h-4 w-4" />
                      <span>Food & Beverages</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="snacks">
                    <div className="flex items-center">
                      <Donut className="mr-2 h-4 w-4" />
                      <span>Snacks</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="baby">
                    <div className="flex items-center">
                      <Baby className="mr-2 h-4 w-4" />
                      <span>Baby</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="groceries">
                    <div className="flex items-center">
                      <ShoppingBasket className="mr-2 h-4 w-4" />
                      <span>Groceries</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="transportation">
                    <div className="flex items-center">
                      <Bus className="mr-2 h-4 w-4" />
                      <span>Transportation</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="education">
                    <div className="flex items-center">
                      <Book className="mr-2 h-4 w-4" />
                      <span>Education</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="entertainment">
                    <div className="flex items-center">
                      <Tv className="mr-2 h-4 w-4" />
                      <span>Entertainment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="giftDonations">
                    <div className="flex items-center">
                      <Gift className="mr-2 h-4 w-4" />
                      <span>Gift & Donations</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="family">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Family</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="health">
                    <div className="flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Health</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="billUtilities">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Bill & Utilities</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="feesCharges">
                    <div className="flex items-center">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Fees & Charges</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="shopping">
                    <div className="flex items-center">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>Shopping</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="investment">
                    <div className="flex items-center">
                      <ChartArea className="mr-2 h-4 w-4" />
                      <span>Investment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="accommodation">
                    <div className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Accommodation</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="others">
                    <div className="flex items-center">
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                      <span>Others</span>
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
          <Button className="w-full">Save</Button>
          <div className="flex justify-between mb-4">
            <Button className="w-1/2 mr-2 bg-transparent border border-blue-500 hover:bg-blue-500 hover:text-white rounded py-2 text-blue-500" onClick={() => window.open("https://bit.ly/adexpense-sheets", "_blank")}>
              Sheets
            </Button>
            <Button className="w-1/2 ml-2 bg-transparent border border-blue-500 hover:bg-blue-500 hover:text-white rounded py-2 text-blue-500" onClick={() => window.open("https://bit.ly/adexpense-dashboards", "_blank")}>
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}