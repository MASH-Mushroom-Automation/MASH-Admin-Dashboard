"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"

type ContentType = {
  title: string
  slug: string
  type: string
  content: string
  author: string
  status: "Draft" | "Published"
  thumbnail: string | null
}

interface ContentFormProps {
  content?: ContentType | null
  onSave: (data: ContentType) => void
  onClose: () => void
}

export default function ContentForm({ content, onSave, onClose }: ContentFormProps) {
  const [formData, setFormData] = useState<ContentType>(
    content ?? {
      title: "",
      slug: "",
      type: "Page",
      content: "",
      author: "Current User",
      status: "Draft",
      thumbnail: null,
    },
  )
  const handleChange = <K extends keyof ContentType>(field: K, value: ContentType[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    } as ContentType))
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
  }

  const handleTitleChange = (value: string) => {
    handleChange("title", value)
    if (!content) {
      handleChange("slug", generateSlug(value))
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content ? "Edit Content" : "Create New Content"}</DialogTitle>
          <DialogDescription>
            {content ? "Update the content details below" : "Fill in the details to create new content"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter content title"
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="auto-generated-slug"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Content Type</Label>
            <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Page">Page</SelectItem>
                <SelectItem value="Blog">Blog</SelectItem>
                <SelectItem value="About Us">About Us</SelectItem>
                <SelectItem value="Help">Help & Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Body */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Enter your content here. Supports basic formatting."
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Supports bold, italics, lists, and links</p>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Cover Image (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleChange("thumbnail", e.target.files[0].name)
                  }
                }}
              />
              <label htmlFor="thumbnail" className="cursor-pointer">
                <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>
            {formData.thumbnail && <p className="text-sm text-muted-foreground">Selected: {formData.thumbnail}</p>}
          </div>

          {/* Publish Status */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Publish Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.status === "Published"
                    ? "This content is visible to the public"
                    : "This content is in draft mode"}
                </p>
              </div>
              <Switch
                checked={formData.status === "Published"}
                onCheckedChange={(checked) => handleChange("status", checked ? "Published" : "Draft")}
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{content ? "Update Content" : "Create Content"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
