import { Download, Eye, MapPin, Pencil, Shield, Trash2 } from "lucide-react";

const SIZE = 15;
const STROKE = 1.9;

export function editMenuItem(onClick) {
  return {
    label: "Edit",
    icon: <Pencil size={SIZE} color="#fb923c" strokeWidth={STROKE} />,
    onClick,
  };
}

export function deleteMenuItem(onClick) {
  return {
    label: "Delete",
    icon: <Trash2 size={SIZE} color="#dc2626" strokeWidth={STROKE} />,
    variant: "danger",
    onClick,
  };
}

export function viewDetailsMenuItem(onClick) {
  return {
    label: "View Details",
    icon: <Eye size={SIZE} color="#0f3d91" strokeWidth={STROKE} />,
    variant: "muted",
    onClick,
  };
}

export function manageAccessMenuItem(onClick) {
  return {
    label: "Manage Access",
    icon: <Shield size={SIZE} color="#0f3d91" strokeWidth={STROKE} />,
    onClick,
  };
}

export function previewDownloadMenuItem(onClick) {
  return {
    label: "Preview / Download",
    icon: <Download size={SIZE} color="#0f3d91" strokeWidth={STROKE} />,
    variant: "muted",
    onClick,
  };
}

export function subLocationMenuItem(onClick) {
  return {
    label: "Sub-location",
    icon: <MapPin size={SIZE} color="#22c55e" strokeWidth={STROKE} />,
    onClick,
  };
}
