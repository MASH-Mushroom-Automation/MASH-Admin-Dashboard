"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function generateUniqueDecimal(): string {
  const chars = "0123456789ABCDEF";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateLocationYear(address: string): string {
  if (!address.trim()) return "";
  const location = address.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  return `${location}${year}`;
}

interface RegisterData {
  chamberName: string;
  contactNumber: string;
  address: string;
  model?: string;
  locationYear: string;
  uniqueDecimal: string;
  deviceId: string;
}

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: RegisterData & { selectedDeviceId?: string }) => void;
  availableDevices?: { id: string; deviceId: string; status?: string }[];
  // optional initial data for edit
  initialData?: Partial<
    RegisterData & { id?: string; selectedDeviceId?: string }
  >;
}
export default function RegisterModal({
  open,
  onOpenChange,
  onSave,
  availableDevices,
  initialData,
}: RegisterModalProps) {
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  type FormState = {
    chamberName: string;
    contactNumber: string;
    address: string;
    model: string;
  };

  const [formData, setFormData] = useState<FormState>({
    chamberName: "",
    contactNumber: "",
    address: "",
    model: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uniqueDecimal] = useState(generateUniqueDecimal());
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined
  );

  const locationYear = generateLocationYear(formData.address);
  const deviceId = `MASH-${formData.model || "---"}-${
    locationYear || "---"
  }-${uniqueDecimal}`;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.chamberName.trim())
      newErrors.chamberName = "Chamber Name is required";
    if (!formData.contactNumber.trim())
      newErrors.contactNumber = "Contact Number is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    // If the user selected an existing device, model is not required (device already exists).
    if (!selectedDeviceId && !formData.model.trim())
      newErrors.model = "Model is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof FormState;
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Define a concrete payload type for saving
  type RegistrationPayload = {
    id?: string;
    chamberName: string;
    contactNumber: string;
    address: string;
    model?: string;
    locationYear: string;
    uniqueDecimal: string;
    deviceId: string;
    selectedDeviceId?: string;
  };

  const handleSave = () => {
    if (validateForm()) {
      // if a device was selected from availableDevices, use that deviceId and include selectedDeviceId
      const selectedDevice = selectedDeviceId
        ? availableDevices?.find((a) => a.id === selectedDeviceId)
        : undefined;
      const payloadDeviceId = selectedDevice
        ? selectedDevice.deviceId
        : deviceId;

      const registrationData: RegistrationPayload = {
        id: editingId,
        chamberName: formData.chamberName,
        contactNumber: formData.contactNumber,
        address: formData.address,
        model: formData.model || undefined,
        locationYear,
        uniqueDecimal,
        deviceId: payloadDeviceId,
        ...(selectedDeviceId ? { selectedDeviceId } : {}),
      };

      console.log("Chamber and Device registered:", registrationData);
      onSave?.(registrationData);
      handleCancel();
    }
  };

  // populate when opening for edit
  useEffect(() => {
    if (open && initialData) {
      setEditingId(initialData.id);
      setFormData((prev) => ({
        ...prev,
        chamberName: initialData.chamberName ?? "",
        contactNumber: initialData.contactNumber ?? "",
        address: initialData.address ?? "",
        model: initialData.model ?? "",
      }));
      setSelectedDeviceId(initialData.selectedDeviceId);
    }
    if (!open) {
      setEditingId(undefined);
    }
  }, [open, initialData]);

  const handleCancel = () => {
    setFormData({
      chamberName: "",
      contactNumber: "",
      address: "",
      model: "",
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Chamber & Device</DialogTitle>
          <DialogDescription>
            Enter chamber information and device registration details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chamber Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chamber Information</CardTitle>
              <CardDescription>Enter the chamber details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="chamberName"
                  className="text-foreground font-medium"
                >
                  Name
                </Label>
                <Input
                  id="chamberName"
                  name="chamberName"
                  placeholder="Enter chamber name"
                  value={formData.chamberName}
                  onChange={handleInputChange}
                  className={errors.chamberName ? "border-destructive" : ""}
                />
                {errors.chamberName && (
                  <p className="text-sm text-destructive">
                    {errors.chamberName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contactNumber"
                  className="text-foreground font-medium"
                >
                  Contact Number
                </Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="Enter contact number"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className={errors.contactNumber ? "border-destructive" : ""}
                />
                {errors.contactNumber && (
                  <p className="text-sm text-destructive">
                    {errors.contactNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-foreground font-medium"
                >
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device Registration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Registration</CardTitle>
              <CardDescription>
                Device ID will be auto-generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* If there are available devices, allow selecting one; otherwise generate a new ID */}
              {Array.isArray(availableDevices) ? (
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Select available device
                  </Label>
                  <Select
                    value={selectedDeviceId}
                    onValueChange={(v) => setSelectedDeviceId(v)}
                  >
                    <SelectTrigger className="w-full bg-white border rounded-md">
                      <SelectValue
                        placeholder={
                          availableDevices.length > 0
                            ? "Choose a device"
                            : "No devices available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDevices.length > 0 ? (
                        availableDevices.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-mono">{d.deviceId}</span>
                              {/* intentionally omit network status in the Registered Users dropdown */}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__no_devices_available" disabled>
                          No devices available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <Label className="text-foreground font-medium">
                      Device ID
                    </Label>
                    <div className="px-3 py-2 bg-primary/10 rounded-md text-foreground font-mono border border-primary/20">
                      {selectedDeviceId
                        ? availableDevices.find(
                            (a) => a.id === selectedDeviceId
                          )?.deviceId ?? "-"
                        : availableDevices.length > 0
                        ? "Select a device"
                        : "No devices available"}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Prefix
                    </Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-foreground">
                      MASH
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="model"
                      className="text-foreground font-medium"
                    >
                      Model
                    </Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="e.g., A1"
                      value={formData.model}
                      onChange={handleInputChange}
                      className={errors.model ? "border-destructive" : ""}
                    />
                    {errors.model && (
                      <p className="text-sm text-destructive">{errors.model}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Location Year
                    </Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-foreground font-mono">
                      {locationYear || "---"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from address and current year
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Unique Decimal
                    </Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-foreground font-mono">
                      {uniqueDecimal}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">
                      Device ID
                    </Label>
                    <div className="px-3 py-2 bg-primary/10 rounded-md text-foreground font-mono border border-primary/20">
                      {deviceId}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
