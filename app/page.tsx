"use client"

import type React from "react"
import { useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const typeOptions:Record<string, string[]> = {
  "Motor Insurance": [
    "Commercial Vehicle",
    "Private Vehicle",
    "Two Wheeler"
  ],
  "Health Insurance": [
    "Individual",
    "Floater",
    "Top Up Mediclaim",
    "Extra Care",
  ],
  "Fire Insurance": [
    "Standard & Perils Insurance",
    "Office Insurance",
    "House Holder Policy",
    "Godown",
  ],
  "Workmen Compensation": [
    "Employees Insurance",
    "Public Liability Insurance"
  ],
  "Professional Indemnity": [
    "Doctors Indemnity"
  ]
}


interface PolicyFormData {
  "Company Name": string
  "LOB Description": string
  "Type": string
  "Policy No": string
  "Prefix": string
  "Insured Name": string
  "Policy Start Date": string
  "Expiry Date": string
  "Sum Insured (in ₹)": string
  "Premium (in ₹)": string
  "GST (in ₹)": string
  "Total Premium (in ₹)": string
}

export default function Home() {
  const [formData, setFormData] = useState<PolicyFormData>({
    "Company Name": '',
    "LOB Description": '',
    "Type": '',
    "Policy No": '',
    "Prefix": '',
    "Insured Name": '',
    "Policy Start Date": '',
    "Expiry Date": '',
    "Sum Insured (in ₹)": '',
    "Premium (in ₹)": '',
    "GST (in ₹)": '',
    "Total Premium (in ₹)": '',
  })

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }
  
  const handleInputChange = (field: keyof PolicyFormData, value: string) => {
    const updatedFormData = { ...formData, [field]: value };
  
    if (field === "Policy Start Date" && value) {
      const startDate = new Date(value);
      const expiryDate = new Date(startDate);
      expiryDate.setFullYear(startDate.getFullYear() + 1);
      expiryDate.setDate(expiryDate.getDate() - 1);
      updatedFormData["Expiry Date"] = expiryDate.toISOString().split("T")[0];
    }
  
    setFormData(updatedFormData);
  };
  

  const [isLoading, setIsLoading] = useState(false);

  // Format number to Indian numbering system (1,22,000/-)
  const formatIndianNumber = (num: number): string => {
    return `${num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      useGrouping: true,
    })}/-`;
  };

  const handleGSTChange = (field: keyof PolicyFormData, value: string) => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const numericValue = cleanValue === '' ? 0 : Number(cleanValue);

    if (!isNaN(numericValue)) {
      // Calculate 18% GST on the premium
      const gstAmount = Math.round(numericValue * 0.18);
      const total = numericValue + gstAmount;

      console.log("Premium:", numericValue);
      console.log("Calculated GST (18%):", formatIndianNumber(gstAmount));
      console.log("Total Premium (Premium + GST):", formatIndianNumber(total));

      setFormData(prev => ({
        ...prev,
        [field]: formatIndianNumber(numericValue),
        "GST (in ₹)": formatIndianNumber(gstAmount),
        "Total Premium (in ₹)": formatIndianNumber(total),
      }));
    } else {
      // If invalid number, just update the premium field
      setFormData(prev => ({
        ...prev,
        [field]: cleanValue,
        "GST (in ₹)": '',
        "Total Premium (in ₹)": ''
      }))
      console.log("Invalid premium value:", cleanValue)
    }
  }

  const handleReset = () => {
    setFormData({
      "Company Name": "",
      "LOB Description": "",
      "Type": "",
      "Policy No": "",
      "Prefix": "",
      "Insured Name": "",
      "Policy Start Date": "",
      "Expiry Date": "",
      "Sum Insured (in ₹)": "",
      "Premium (in ₹)": "",
      "GST (in ₹)": "",
      "Total Premium (in ₹)": "",
    })
    toast.success("Form reset successfully!")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submission started', { formData })

    // Validate required fields
    const requiredFields = ["Company Name", "LOB Description", "Type", "Policy No", "Insured Name"]
    const missingFields = requiredFields.filter((field) => !formData[field as keyof PolicyFormData])

    if (missingFields.length > 0) {
      const errorMsg = `Please fill in all required fields: ${missingFields.join(", ")}`
      // console.error('Validation failed:', errorMsg)
      toast.error(errorMsg)
      return
    }

    const formattedData = {
      ...formData,
      "Policy Start Date": formatDate(formData["Policy Start Date"]),
      "Expiry Date": formatDate(formData["Expiry Date"]),
    };

    setIsLoading(true)
    console.log('Sending request to /api/submit-policy', { formattedData })

    try {
      const response = await fetch("/api/submit-policy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      console.log('Received response status:', response.status)
      const result = await response.json()
      console.log('API Response:', JSON.stringify(result, null, 2))

      if (result.success) {
        // Reset form values
        setFormData({
          "Company Name": "",
          "LOB Description": "",
          "Type": "",
          "Policy No": "",
          "Prefix": "",
          "Insured Name": "",
          "Policy Start Date": "",
          "Expiry Date": "",
          "Sum Insured (in ₹)": "",
          "Premium (in ₹)": "",
          "GST (in ₹)": "",
          "Total Premium (in ₹)": "",
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
                  <Select value={formData['Company Name']} onValueChange={(value) => handleInputChange('Company Name', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New India Assurance">New India Assurance Co. Ltd.</SelectItem>
                      <SelectItem value="National Insurance Co. Ltd.">National Insurance Co. Ltd.</SelectItem>
                      <SelectItem value="Oriental Insurance Co. Ltd.">Oriental Insurance Co. Ltd.</SelectItem>
                      <SelectItem value="Bajaj Alianz GIC Ltd.">Bajaj Alianz GIC Ltd.</SelectItem>
                      <SelectItem value="Future Generali GIC Ltd.">Future Generali GIC Ltd.</SelectItem>
                      <SelectItem value="TATA AIG GIC Ltd.">TATA AIG GIC Ltd.</SelectItem>
                      <SelectItem value="Iffco Tokio GIC Ltd.">Iffco Tokio GIC Ltd.</SelectItem>
                      <SelectItem value="Shriram GIC Ltd.">Shriram GIC Ltd.</SelectItem>
                      <SelectItem value="Royal Sundaram">Royal Sundaram GIC Ltd.</SelectItem>
                      <SelectItem value="HDFC ERGO GIC Ltd.">HDFC ERGO GIC Ltd.</SelectItem>
                      <SelectItem value="ICICI Lombard GIC Ltd.">ICICI Lombard GIC Ltd.</SelectItem>
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
                  <Select value={formData['LOB Description']} onValueChange={(value) => handleInputChange('LOB Description', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select LOB" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                      <SelectItem value="Motor Insurance">Motor Insurance</SelectItem>
                      <SelectItem value="Fire Insurance">Fire Insurance</SelectItem>
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
                  <Select value={formData['Type']} onValueChange={(value) => handleInputChange('Type', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                    {typeOptions[formData['LOB Description']]?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
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
                    value={formData['Policy No']}
                    onChange={(e) => handleInputChange('Policy No', e.target.value)}
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
                  <Select value={formData['Prefix']} onValueChange={(value) => handleInputChange('Prefix', value)}>
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
                    value={formData['Insured Name']}
                    onChange={(e) => handleInputChange('Insured Name', e.target.value)}
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
                    value={formData['Policy Start Date']}
                    onChange={(e) => handleInputChange('Policy Start Date', e.target.value)}
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
                    value={formData['Expiry Date']}
                    onChange={(e) => handleInputChange('Expiry Date', e.target.value)}
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
                  <Select value={formData['Sum Insured (in ₹)']} onValueChange={(value) => handleInputChange('Sum Insured (in ₹)', value)}>
                    <SelectTrigger className="bg-gray-100 w-full border-0 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select Sum Insured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1,00,000">₹1,00,000</SelectItem>
                      <SelectItem value="2,00,000">₹2,00,000</SelectItem>
                      <SelectItem value="3,00,000">₹3,00,000</SelectItem>
                      <SelectItem value="4,00,000">₹4,00,000</SelectItem>
                      <SelectItem value="5,00,000">₹5,00,000</SelectItem>
                      <SelectItem value="8,00,000">₹8,00,000</SelectItem>
                      <SelectItem value="10,00,000">₹10,00,000</SelectItem>
                      <SelectItem value="13,00,000">₹13,00,000</SelectItem>
                      <SelectItem value="15,00,000">₹15,00,000</SelectItem>
                      <SelectItem value="20,00,000">₹20,00,000</SelectItem>
                      <SelectItem value="22,00,000">₹22,00,000</SelectItem>
                      <SelectItem value="25,00,000">₹25,00,000</SelectItem>
                      <SelectItem value="50,00,000">₹50,00,000</SelectItem>
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
                    value={formData['Premium (in ₹)']}
                    onChange={(e) => handleGSTChange('Premium (in ₹)', e.target.value)}
                    placeholder="Enter Premium (in ₹)"
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gst" className="text-sm font-medium text-gray-600">
                    GST (in 18%)
                  </Label>
                  <Input
                    id="gst"
                    type="text"
                    value={formData['GST (in ₹)']}
                    onChange={(e) => handleInputChange('GST (in ₹)', e.target.value)}
                    placeholder="Enter GST (in 18%)"
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
                    value={formData['Total Premium (in ₹)']}
                    onChange={(e) => handleInputChange('Total Premium (in ₹)', e.target.value)}
                    placeholder="Enter Total Premium (in ₹)"
                    className="bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 h-[48px]"
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

                <Button
                  type="button"
                  disabled={isLoading}
                  variant="outline"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 h-[48px]"
                >
                  <RefreshCw className="w-5 h-5" /> Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
