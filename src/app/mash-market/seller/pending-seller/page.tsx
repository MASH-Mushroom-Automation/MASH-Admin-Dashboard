// "use client"

// import { useState } from "react"
// import { Input } from "@/components/ui/input"
// import { Card } from "@/components/ui/card"
// import { Search,  ChevronRight } from "lucide-react"
// import { SellerTable } from "@/components/ecommerce/seller-table"
// import { useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import PaginationWrapper from "@/components/pagination"



// export type TabType = "all" | "approval" | "approved" | "rejected"

// interface Seller {
//   id: string
//   name: string
//   storeName: string
//   email: string
//   status: "pending" | "approved" | "rejected"
//   address?: string
// }

// const mockSellers: Seller[] = [
//   { id: "1", name: "Jin Failana", storeName: "Smith Electronics", email: "john@smithelectronics.com", status: "approved", address: "Caloocan City" },
//   { id: "2", name: "Karen Smith", storeName: "Karen’s Boutique", email: "karen@boutique.com", status: "approved", address: "Quezon City" },
//   { id: "3", name: "Anne Curtis", storeName: "Anne’s Beauty Hub", email: "anne@beautyhub.com", status: "approved", address: "Makati City" },
//   { id: "4", name: "Anne Curtis", storeName: "Anne’s Beauty Hub", email: "anne@beautyhub.com", status: "approved", address: "Makati City" },
//   { id: "5", name: "Anne Curtis", storeName: "Anne’s Beauty Hub", email: "anne@beautyhub.com", status: "approved", address: "Makati City" },
//   { id: "6", name: "Anne Curtis", storeName: "Anne’s Beauty Hub", email: "anne@beautyhub.com", status: "approved", address: "Makati City" },


// ]

// export default function SellerContent() {
//   const [activeTab, setActiveTab] = useState<TabType>("approved")
//   const [searchQuery, setSearchQuery] = useState("")
//   const [currentPage, setCurrentPage] = useState(1)
//   const itemsPerPage = 5
//   const router = useRouter()

//    const filteredSellers = mockSellers.filter((seller) => {
//   // filter by tab
//   const matchesTab =
//     activeTab === "all" ||
//     (activeTab === "approval" && seller.status === "pending") ||
//     (activeTab === "approved" && seller.status === "approved") ||
//     (activeTab === "rejected" && seller.status === "rejected")

//   // filter by search
//   const matchesSearch =
//     seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     seller.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     seller.email.toLowerCase().includes(searchQuery.toLowerCase())

//   return matchesTab && matchesSearch
// })


//   const totalPages = Math.ceil(filteredSellers.length / itemsPerPage)
//   const startIndex = (currentPage - 1) * itemsPerPage
//   const endIndex = startIndex + itemsPerPage
//   const paginatedSellers = filteredSellers.slice(startIndex, endIndex)

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page)
//   }

//   return (
//     <div className="min-h-screen bg-background p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header Section */}
//         <div className="mb-8">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//            <div>
//       <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
//         All Sellers
//       </h1>
//       <p className="text-muted-foreground text-sm sm:text-base">
//         Manage seller accounts
//       </p>
//     </div>

//     <Button
//       onClick={() => router.push("/mash-market/seller/pending-seller")}
//       className="bg-primary hover:bg-primary/80 gap-2 w-full sm:w-auto justify-center"
//     >
//       Pending Seller
//       <ChevronRight className="h-4 w-4" />
//     </Button>
//   </div>
// </div>

//         {/* Controls Section */}
//         <div className="flex flex-col sm:flex-row gap-3 mb-6">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//             <Input
//               placeholder="Search sellers..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="pl-10"
//             />
//           </div>
        
//         </div>

//         {/* Table Section */}
//         {/* <Card className="overflow-hidden">
//           <SellerTable 
//             sellers={paginatedSellers}
//             activeTab={activeTab} 
//             searchQuery={searchQuery} 
//             showStatus={false}
//             mode="all"
//             />
//         </Card> */}

//    {/* Pagination Section */}
//         <PaginationWrapper
//             totalItems={filteredSellers.length}
//             itemsPerPage={itemsPerPage}
//             currentPage={currentPage}
//             onPageChange={handlePageChange}
//             label="sellers"
//         />

//       </div>
//     </div>
//   )
// }

