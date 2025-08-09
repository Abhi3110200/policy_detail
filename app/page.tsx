"use client"

import type React from "react"

import { useState } from 'react'
import { RefreshCw, Calendar, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface PolicyFormData {
  companyName: string
  lobDescription: string
  type: string
  policyNo: string
  prefix: string
  insuredName: string
  policyStartDate: string
  expiryDate: string
  sumInsured: string
  premium: string
  gst: string
  totalPremium: string
}

export default function Home() {
  const [formData, setFormData] = useState<PolicyFormData>({
    companyName: '',
    lobDescription: '',
    type: '',
    policyNo: '',
    prefix: '',
    insuredName: '',
    policyStartDate: '',
    expiryDate: '',
    sumInsured: '',
    premium: '',
    gst: '',
    totalPremium: '',
  })

  const handleInputChange = (field: keyof PolicyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const [isLoading, setIsLoading] = useState(false);

  const handleGSTChange = (value: string) => {
    // Remove non-numeric characters (like '₹' and commas) before parsing
    const cleanValue = value.replace(/[^0-9.]/g, "")
    const premiumValue = Number.parseFloat(cleanValue)
    
    if (!isNaN(premiumValue)) {
      // Calculate 18% GST on the premium
      const gstAmount = (premiumValue * 0.18).toFixed(2)
      const total = (premiumValue + parseFloat(gstAmount)).toFixed(2)
      
      console.log("Premium:", premiumValue)
      console.log("Calculated GST (18%):", gstAmount)
      console.log("Total Premium (Premium + GST):", total)
      
      setFormData(prev => ({
        ...prev,
        premium: cleanValue,
        gst: gstAmount,
        totalPremium: total
      }))
    } else {
      // If invalid number, just update the premium field
      setFormData(prev => ({
        ...prev,
        premium: cleanValue,
        gst: '',
        totalPremium: ''
      }))
      console.log("Invalid premium value:", cleanValue)
    }
  }

  const handleReset = () => {
    setFormData({
      companyName: "",
      lobDescription: "",
      type: "",
      policyNo: "",
      prefix: "",
      insuredName: "",
      policyStartDate: "",
      expiryDate: "",
      sumInsured: "",
      premium: "",
      gst: "",
      totalPremium: "",
    })
    toast.success("Form reset successfully!")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submission started', { formData })

    // Validate required fields
    const requiredFields = ["companyName", "lobDescription", "type", "policyNo", "insuredName"]
    const missingFields = requiredFields.filter((field) => !formData[field as keyof PolicyFormData])

    if (missingFields.length > 0) {
      const errorMsg = `Please fill in all required fields: ${missingFields.join(", ")}`
      console.error('Validation failed:', errorMsg)
      toast.error(errorMsg)
      return
    }

    setIsLoading(true)
    console.log('Sending request to /api/submit-policy', { formData })

    const policyData = {
      ...formData,
      submittedAt: new Date().toISOString(),
    }

    try {
      const response = await fetch("/api/submit-policy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(policyData),
      })
      
      console.log('Received response status:', response.status)
      const result = await response.json()
      console.log('API Response:', JSON.stringify(result, null, 2))

      if (result.success) {
        // Reset form values
        setFormData({
          companyName: "",
          lobDescription: "",
          type: "",
          policyNo: "",
          prefix: "",
          insuredName: "",
          policyStartDate: "",
          expiryDate: "",
          sumInsured: "",
          premium: "",
          gst: "",
          totalPremium: "",
        })
        toast.success("Policy data saved to Google Sheet successfully!")
      } else {
        toast.error(result.error || "Failed to save data")
      }
    } catch (error) {
      console.error("Submission error:", error)
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error("Network error. Please try again.")
      }
    } finally {
      setIsLoading(false) // Always set loading to false when the operation is complete
      console.log("isLoading set to false")
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-semibold text-gray-800">Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Company Name & LOB Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-600">
                    Company Name
                  </Label>
                  <Select value={formData.companyName} onValueChange={(value) => handleInputChange('companyName', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New India Assurance">New India Assurance</SelectItem>
                      <SelectItem value="Bajaj Alianz GIC Ltd.">Bajaj Alianz GIC Ltd.</SelectItem>
                      <SelectItem value="Future Generali GIC Ltd.">Future Generali GIC Ltd.</SelectItem>
                      <SelectItem value="TATA AIG GIC Ltd.">TATA AIG GIC Ltd.</SelectItem>
                      <SelectItem value="Iffco Tokio GIC Ltd.">Iffco Tokio GIC Ltd.</SelectItem>
                      <SelectItem value="Shriram GIC Ltd.">Shriram GIC Ltd.</SelectItem>
                      <SelectItem value="Royal Sundaram">Royal Sundaram</SelectItem>
                      <SelectItem value="HDFC ERGO GIC Ltd.">HDFC ERGO GIC Ltd.</SelectItem>
                      <SelectItem value="National Insurance Co. Ltd.">National Insurance Co. Ltd.</SelectItem>
                      <SelectItem value="Oriental Insurance Co. Ltd.">Oriental Insurance Co. Ltd.</SelectItem>
                      <SelectItem value="ICICI Lombard">ICICI Lombard</SelectItem>
                      <SelectItem value="Reliance GIC Ltd.">Reliance GIC Ltd.</SelectItem>
                      <SelectItem value="SBI GIC Ltd.">SBI GIC Ltd.</SelectItem>
                      <SelectItem value="Star & Allied GIC Ltd.">Star & Allied GIC Ltd.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lobDescription" className="text-sm font-medium text-gray-600">
                    LOB Description
                  </Label>
                  <Select value={formData.lobDescription} onValueChange={(value) => handleInputChange('lobDescription', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select LOB" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Motor">Motor</SelectItem>
                      <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                      <SelectItem value="Fire">Fire</SelectItem>
                      <SelectItem value="Workmen Compensation">Workmen Compensation</SelectItem>
                      <SelectItem value="Professional Indemnity">Professional Indemnity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Type & Policy No. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-600">
                    Type
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Floater">Floater</SelectItem>
                      <SelectItem value="Organisation">Organisation</SelectItem>
                      <SelectItem value="Commercial Vehicle">Commercial Vehicle</SelectItem>
                      <SelectItem value="Private Vehicle">Private Vehicle</SelectItem>
                      <SelectItem value="Top Up Mediclaim">Top Up Mediclaim</SelectItem>
                      <SelectItem value="Extra Care">Extra Care</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Godown">Godown</SelectItem>
                      <SelectItem value="Two Wheeler">Two Wheeler</SelectItem>
                      <SelectItem value="Office Insurance">Office Insurance</SelectItem>
                      <SelectItem value="Standard & Perils Insurance Fire">Standard & Perils Insurance Fire</SelectItem>
                      <SelectItem value="Public Liability Insurance">Public Liability Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyNo" className="text-sm font-medium text-gray-600">
                    Policy No.
                  </Label>
                  <Input
                    id="policyNo"
                    type="text"
                    value={formData.policyNo}
                    onChange={(e) => handleInputChange('policyNo', e.target.value)}
                    placeholder="Enter Policy Number"
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Prefix & Insured Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prefix" className="text-sm font-medium text-gray-600">
                    Prefix
                  </Label>
                  <Select value={formData.prefix} onValueChange={(value) => handleInputChange('prefix', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select Prefix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr.</SelectItem>
                      <SelectItem value="Mrs">Mrs.</SelectItem>
                      <SelectItem value="Ms">Ms.</SelectItem>
                      <SelectItem value="Dr">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuredName" className="text-sm font-medium text-gray-600">
                    Insured Name
                  </Label>
                  <Input
                    id="insuredName"
                    type="text"
                    value={formData.insuredName}
                    onChange={(e) => handleInputChange('insuredName', e.target.value)}
                    placeholder="Enter Insured Name"
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Policy Start Date & Expiry Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="policyStartDate" className="text-sm font-medium text-gray-600">
                    Policy Start Date
                  </Label>
                  <Input
                    id="policyStartDate"
                    type="date"
                    value={formData.policyStartDate}
                    onChange={(e) => handleInputChange('policyStartDate', e.target.value)}
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-600">
                    Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 5: Sum Insured & Premium */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sumInsured" className="text-sm font-medium text-gray-600">
                    Sum Insured (in ₹)
                  </Label>
                  <Select value={formData.sumInsured} onValueChange={(value) => handleInputChange('sumInsured', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select Sum Insured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="₹1,00,000">₹1,00,000</SelectItem>
                      <SelectItem value="₹2,00,000">₹2,00,000</SelectItem>
                      <SelectItem value="₹3,00,000">₹3,00,000</SelectItem>
                      <SelectItem value="₹4,00,000">₹4,00,000</SelectItem>
                      <SelectItem value="₹5,00,000">₹5,00,000</SelectItem>
                      <SelectItem value="₹8,00,000">₹8,00,000</SelectItem>
                      <SelectItem value="₹10,00,000">₹10,00,000</SelectItem>
                      <SelectItem value="₹15,00,000">₹15,00,000</SelectItem>
                      <SelectItem value="₹20,00,000">₹20,00,000</SelectItem>
                      <SelectItem value="₹22,00,000">₹22,00,000</SelectItem>
                      <SelectItem value="₹25,00,000">₹25,00,000</SelectItem>
                      <SelectItem value="₹50,00,000">₹50,00,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="premium" className="text-sm font-medium text-gray-600">
                    Premium (in ₹)
                  </Label>
                  <Input
                    id="premium"
                    type="text"
                    value={formData.premium}
                    onChange={(e) => handleGSTChange(e.target.value)}
                    placeholder="Enter Premium (in ₹)"
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gst" className="text-sm font-medium text-gray-600">
                    GST (in %)
                  </Label>
                  <Input
                    id="gst"
                    type="text"
                    value={formData.gst}
                    onChange={(e) => handleInputChange('gst', e.target.value)}
                    placeholder="Enter GST (in %)"
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPremium" className="text-sm font-medium text-gray-600">
                    Total Premium (in ₹)
                  </Label>
                  <Input
                    id="totalPremium"
                    type="text"
                    value={formData.totalPremium}
                    onChange={(e) => handleInputChange('totalPremium', e.target.value)}
                    placeholder="Enter Total Premium (in ₹)"
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row gap-4 pt-6">
                <Button
                  type="button"
                  disabled={isLoading}
                  variant="outline"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 h-[48px]"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 h-[48px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving to Google Sheet...
                    </>
                  ) : (
                    "Submit to Google Sheet"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
