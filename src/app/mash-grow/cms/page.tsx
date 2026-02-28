"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cmsService, type CMSArticle } from "@/services/mashGrowService";

export default function CMSPage() {
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Getting Started",
    description: "",
    content: "",
    published: false,
  });

  // Fetch articles from backend
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cmsService.getAll();
      setArticles(response.data);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to load articles';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (article?: CMSArticle) => {
    if (article) {
      setEditingId(article.id);
      setFormData({
        title: article.title,
        category: article.category,
        description: article.description,
        content: article.content,
        published: article.published,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        category: "Getting Started",
        description: "",
        content: "",
        published: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.content.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        await cmsService.update(editingId, formData);
        toast.success("Article updated successfully");
      } else {
        await cmsService.create(formData);
        toast.success("Article created successfully");
      }
      setIsModalOpen(false);
      fetchArticles(); // Refresh the list
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to save article';
      toast.error(errorMessage);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await cmsService.delete(id);
      toast.success("Article archived successfully");
      fetchArticles(); // Refresh the list
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to archive article';
      toast.error(errorMessage);
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Help & Support CMS
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage help articles for MashGrow
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4" />
            New Article
          </Button>
        </div>

        {/* Table */}
        <Card className="border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading articles...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">
                {error}
              </div>
            ) : (
              <Table className="w-full">
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="text-foreground font-semibold">
                      Title
                    </TableHead>
                    <TableHead className="text-foreground font-semibold">
                      Category
                    </TableHead>
                    <TableHead className="text-foreground font-semibold">
                      Description
                    </TableHead>
                    <TableHead className="text-foreground font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-foreground font-semibold">
                      Created
                    </TableHead>
                    <TableHead className="text-foreground font-semibold text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.length > 0 ? (
                    articles.map((article) => (
                      <TableRow key={article.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium min-w-0 truncate">
                          {article.title}
                        </TableCell>
                        <TableCell className="min-w-0 truncate">
                          {article.category}
                        </TableCell>
                        <TableCell className="min-w-0 truncate">
                          {article.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              article.published
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {article.published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(article.createdAt).toISOString().split("T")[0]}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenModal(article)}
                              className="p-2 hover:bg-muted rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleArchive(article.id)}
                              className="p-2 hover:bg-muted rounded-md transition-colors"
                              title="Archive"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No articles found. Create your first article to get
                        started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      {/* Article Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Article" : "Create New Article"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <Input
                placeholder="Article title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category *
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Getting Started">
                    Getting Started
                  </SelectItem>
                  <SelectItem value="Account">Account</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description *
              </label>
              <Input
                placeholder="Brief description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content *
              </label>
              <Textarea
                placeholder="Article content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label
                htmlFor="published"
                className="text-sm font-medium text-foreground"
              >
                Publish this article
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
