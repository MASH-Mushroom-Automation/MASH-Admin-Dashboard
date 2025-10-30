"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, Settings2 } from "lucide-react"

export default function AccountDetailsPage() {
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected" | null>(null)
  const searchParams = useSearchParams()
  const sellerId = searchParams?.get("id")

  const [seller, setSeller] = useState({
    firstName: "Samantha",
    lastName: "Santos",
    retailer: "Retailer",
    gender: "Female",
    birthday: "01/21/1995",
    username: "samsantos",
    email: "samantha@gmail.com",
    companyName: "ShopNest Co.",
    contactNumber: "1234-123-12",
    jobPosition: "Department Head",
    permitNumber: "12121352232",
    address: "523 U.S 321",
    website: "www.shopnest.com",
    city: "Austin",
    postal: "121 212",
    country: "United States",
    state: "Texas",
  })

  useEffect(() => {
    if (!sellerId) return
    setSeller((prev) => ({
      ...prev,
      firstName: `Seller ${sellerId}`,
      username: `seller_${sellerId}`,
      email: `seller${sellerId}@example.com`,
      companyName: `ShopNest ${sellerId}`,
    }))
  }, [sellerId])

  const handleAccept = () => {
    setStatus("accepted")
  }

  const handleReject = () => {
    setStatus("rejected")
  }

  return (
<div className="flex-1 h-screen overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-gray-900">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Back</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Account Details Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-8">
            {/* Profile Image */}
            <div className="shrink-0">
              <div className="w-40 h-40 bg-linear-to-br from-yellow-200 to-green-200 rounded-lg overflow-hidden">
                  <img src="/woman-profile-photo.jpg" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Account Details */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Details {sellerId ? `— ${sellerId}` : ""}</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">First Name</label>
                  <input
                    type="text"
                    value={seller.firstName}
                    readOnly
                    className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Retailer</label>
                  <input
                    type="text"
                    value={seller.retailer}
                    readOnly
                    className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Name</label>
                  <input
                    type="text"
                    value={seller.lastName}
                    readOnly
                    className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Gender</label>
                  <input
                    type="text"
                    value={seller.gender}
                    readOnly
                    className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Birthday</label>
                  <input
                    type="text"
                    value={seller.birthday}
                    readOnly
                    className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Credentials Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Credentials</h2>
          <p className="text-sm text-gray-500 mb-6">Login and access information</p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Username</label>
              <input
                type="text"
                value={seller.username}
                readOnly
                className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                value={seller.email}
                readOnly
                className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Company Details Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Details</h2>
          <p className="text-sm text-gray-500 mb-6">Company credentials and background</p>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Company Name</label>
                <input
                  type="text"
                  value={seller.companyName}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Company Contact Number</label>
                <input
                  type="text"
                  value={seller.contactNumber}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Reseller Job Position</label>
                <input
                  type="text"
                  value={seller.jobPosition}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Reseller Permit Number</label>
                <input
                  type="text"
                  value={seller.permitNumber}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Company Address</label>
                <input
                  type="text"
                  value={seller.address}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Website</label>
                <input
                  type="text"
                  value={seller.website}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">City</label>
                <input
                  type="text"
                  value={seller.city}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Post Code / Zip</label>
                <input
                  type="text"
                  value={seller.postal}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Country</label>
                <input
                  type="text"
                  value={seller.country}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">State</label>
                <input
                  type="text"
                  value={seller.state}
                  readOnly
                  className="mt-2 w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end mb-8">
          <button
            onClick={handleReject}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              status === "rejected" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            }`}
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              status === "accepted" ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Accept
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`p-4 rounded-lg text-center font-medium ${
              status === "accepted"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status === "accepted" ? "✓ Account has been accepted" : "✗ Account has been rejected"}
          </div>
        )}
      </div>
    </div>
  )
}
