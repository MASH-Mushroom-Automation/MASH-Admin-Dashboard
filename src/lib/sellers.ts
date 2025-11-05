export type SellerStatus = "pending" | "approved" | "rejected"

export interface SellerDocument {
  id: string
  name: string
  url: string
  mime: string
}

export interface Seller {
  id: string
  name: string
  storeName: string
  email: string
  status: SellerStatus
  gender?: string
  birthday?: string
  username?: string
  companyName?: string
  contact?: string
  reseller?: string
  address?: string
  website?: string
  avatar?: string
  documents?: SellerDocument[]
}

export interface SellerLogEntry {
  type: "update" | "status" | "delete"
  id: string
  when: string
  status?: SellerStatus
  by?: string
}

const STORAGE_KEY = "mash_sellers_v1"
const LOG_KEY = "mash_sellers_logs_v1"

const initialMock: Seller[] = [
  {
    id: "1",
    name: "Jin Failana",
    storeName: "Smith Electronics",
    email: "john@smithelectronics.com",
    status: "pending",
    avatar: "/pictures/logo.png",
    documents: [
      {
        id: "d1",
        name: "business-permit.pdf",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        mime: "application/pdf",
      },
      {
        id: "d2",
        name: "id.jpg",
        url: "/pictures/logo.png",
        mime: "image/jpeg",
      },
    ],
  },
  {
    id: "2",
    name: "Karen Smith",
    storeName: "Karen's Crafts",
    email: "karen@crafts.com",
    status: "approved",
    avatar: "/pictures/logo.png",
    documents: [],
  },
  {
    id: "3",
    name: "Anne Curtis",
    storeName: "Anne's Produce",
    email: "anne@produce.com",
    status: "rejected",
    avatar: "/pictures/logo.png",
    documents: [],
  },
]

function readStorage(): Seller[] {
  if (typeof window === "undefined") return initialMock
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialMock
    return JSON.parse(raw) as Seller[]
  } catch {
    return initialMock
  }
}

function writeStorage(sellers: Seller[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sellers))
}

function readLogs(): SellerLogEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SellerLogEntry[]
  } catch {
    return []
  }
}

function pushLog(entry: SellerLogEntry) {
  if (typeof window === "undefined") return
  const logs = readLogs()
  logs.unshift(entry)
  localStorage.setItem(LOG_KEY, JSON.stringify(logs))
}

export function getAllSellers(): Seller[] {
  return readStorage()
}

export function getSellerById(id: string): Seller | undefined {
  return readStorage().find((s) => s.id === id)
}

export function updateSeller(updated: Seller) {
  const sellers = readStorage()
  const idx = sellers.findIndex((s) => s.id === updated.id)
  if (idx === -1) {
    sellers.push(updated)
  } else {
    sellers[idx] = updated
  }
  writeStorage(sellers)
  pushLog({ type: "update", id: updated.id, when: new Date().toISOString() })
}

export function updateSellerStatus(id: string, status: SellerStatus, by = "admin") {
  const sellers = readStorage()
  const idx = sellers.findIndex((s) => s.id === id)
  if (idx === -1) return
  sellers[idx].status = status
  writeStorage(sellers)
  pushLog({ type: "status", id, status, by, when: new Date().toISOString() })
}

export function deleteSeller(id: string) {
  const sellers = readStorage().filter((s) => s.id !== id)
  writeStorage(sellers)
  pushLog({ type: "delete", id, when: new Date().toISOString() })
}

export function getLogs() {
  return readLogs()
}
