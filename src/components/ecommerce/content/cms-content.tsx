"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import ContentTable from "../content-table"
import ContentForm from "../content-form"
import ContentPreview from "../content-preview"

export default function CMSDashboard() {
  type Content = {
    id: string | number
    title: string
    type: string
    author: string
    status: string
    lastUpdated: string
  }

  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("all")
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [previewContent, setPreviewContent] = useState<Content | null>(null)

  // Mock data
  const [contents, setContents] = useState<Content[]>([
    {
      id: 1,
      title: "Welcome to Our Store",
      type: "Page",
      author: "John Doe",
      status: "Published",
      lastUpdated: "2024-10-20",
    },
    {
      id: 2,
      title: "How to Use Our Platform",
      type: "Help",
      author: "Jane Smith",
      status: "Draft",
      lastUpdated: "2024-10-19",
    },
    {
      id: 3,
      title: "New Product Launch",
      type: "Blog",
      author: "Mike Johnson",
      status: "Pending Approval",
      lastUpdated: "2024-10-18",
    },
    {
      id: 4,
      title: "About Our Company",
      type: "About Us",
      author: "Sarah Williams",
      status: "Published",
      lastUpdated: "2024-10-17",
    },
  ])


  const handleSaveContent = (data: any) => {
    if (editingContent) {
      // Compare ids as strings to handle numeric or string IDs
      setContents((prev) =>
        prev.map((c) =>
          String(c.id) === String(editingContent.id)
            ? { ...c, ...data, lastUpdated: new Date().toISOString().split("T")[0] }
            : c
        )
      )
    } else {
      // Safely compute next numeric id from any numeric-like ids in the list
      const numericIds = contents.map((c) => Number(c.id)).filter((n) => !isNaN(n))
      const maxId = numericIds.length ? Math.max(...numericIds) : 0
      const nextId = maxId + 1
      setContents([
        ...contents,
        {
          id: nextId,
          title: (data.title as string) || "Untitled",
          type: (data.type as string) || "Page",
          author: (data.author as string) || "Unknown",
          status: (data.status as string) || "Draft",
          lastUpdated: new Date().toISOString().split("T")[0],
        },
      ])
    }

    // close the form and reset editing state
    setShowForm(false)
    setEditingContent(null)
  }

  const handleDeleteContent = (id: string | number) => {
    setContents((prev) => prev.filter((c) => String(c.id) !== String(id)))
  }

  const handlePublishToggle = (id: string | number) => {
    setContents((prev) =>
      prev.map((c) =>
        String(c.id) === String(id)
          ? {
              ...c,
              status: c.status === "Published" ? "Draft" : "Published",
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : c
      )
    )
  }

  const filteredContents = contents.filter((c) => {
    // global type filter
    if (filterType !== "all" && c.type !== filterType) return false

    // search by title or author
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!c.title.toLowerCase().includes(q) && !c.author.toLowerCase().includes(q)) return false
    }

    // tabs filtering
    if (activeTab === "pages" && c.type !== "Page") return false
    if (activeTab === "blogs" && c.type !== "Blog") return false
    if (activeTab === "about" && c.type !== "About Us") return false
    if (activeTab === "help" && c.type !== "Help") return false
    if (activeTab === "pending" && c.status !== "Pending Approval") return false

    return true
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">Content Management System</h1>
          <p className="mt-2 text-muted-foreground">Manage pages, blogs, and site content from one place.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or author..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Page">Pages</SelectItem>
                <SelectItem value="Blog">Blogs</SelectItem>
                <SelectItem value="About Us">About Us</SelectItem>
                <SelectItem value="Help">Help</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              setEditingContent(null)
              setShowForm(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Content
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-2">
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
            <TabsTrigger value="about">About Us</TabsTrigger>
            <TabsTrigger value="help">Help & Support</TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          {["all", "pages", "blogs", "about", "help", "pending"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <ContentTable
                contents={filteredContents}
                onEdit={(content) => {
                  setEditingContent(content)
                  setShowForm(true)
                }}
                onDelete={handleDeleteContent}
                onPublishToggle={handlePublishToggle}
                onPreview={setPreviewContent}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ContentForm
          content={
            editingContent
              ? ({
                  title: editingContent.title,
                  type: editingContent.type,
                  author: editingContent.author,
                  status: editingContent.status,
                  slug: (editingContent.title || "").toLowerCase().replace(/\s+/g, "-"),
                  content: "",
                  thumbnail: "",
                } as any)
              : null
          }
          onSave={handleSaveContent}
          onClose={() => {
            setShowForm(false)
            setEditingContent(null)
          }}
        />
      )}

      {/* Preview Modal */}
      {previewContent && <ContentPreview content={previewContent} onClose={() => setPreviewContent(null)} />}
    </div>
  )
}
