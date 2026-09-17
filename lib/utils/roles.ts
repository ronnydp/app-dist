import { Ionicons } from "@expo/vector-icons";

export type RoleOption = {
  value: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "vendedor",
    label: "Vendedor",
    description: "Gestión de pedidos, clientes y productos.",
    icon: "person-outline",
  },
  {
    value: "admin",
    label: "Administrador",
    description: "Acceso completo a la aplicación.",
    icon: "shield-checkmark-outline",
  },
  {
    value: "supervisor",
    label: "Supervisor",
    description: "Vista de reportes y usuarios.",
    icon: "eye-outline",
  },
];

export const getRoleOption = (role?: string): RoleOption | undefined =>
  ROLE_OPTIONS.find((option) => option.value === role);

export const getRoleLabel = (role?: string): string =>
  getRoleOption(role)?.label || "Sin rol";

export const getRoleDescription = (role?: string): string =>
  getRoleOption(role)?.description || "Sin permisos asignados.";
