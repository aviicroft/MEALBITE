export type MealType = "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER";

export type MealAvailability = "AVAILABLE" | "FINISHED";

export type DeliveryStatus =
  | "PREPARING"
  | "DISPATCHED"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "DELAYED";

export type BookingStatus =
  | "BOOKED"
  | "COLLECTED"
  | "CANCELLED"
  | "EXPIRED";

export interface IMeal {
  id: string;
  date: Date | string;
  type: MealType | string;
  menu: string;
  availability: MealAvailability;
  bookingOpen: Date | string;
  bookingClose: Date | string;
  createdAt?: Date | string;
  _count?: {
    bookings: number;
  };
  hasBooked?: boolean;
  userBooking?: IBooking | null;
}

export interface IBooking {
  id: string;
  userId: string;
  mealId: string;
  status: BookingStatus;
  qrToken: string;
  bookedAt: Date | string;
  collectedAt?: Date | string | null;
  collectedBy?: string | null;
  meal?: IMeal;
  user?: {
    name: string;
    email: string;
    studentId?: string;
    roomNumber?: string;
  };
}

export interface IDelivery {
  id: string;
  _id?: string; // Compatibility helper
  mealId?: string | null;
  mealType: MealType | string;
  deliveryDate: Date | string;
  targetHostel: string;
  status: DeliveryStatus;
  dispatchTime?: Date | string | null;
  expectedArrivalTime: Date | string;
  actualArrivalTime?: Date | string | null;
  isDelayed: boolean;
  delayReason?: string;
  notes?: string;
  updatedBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface INotification {
  id: string;
  _id?: string; // Compatibility helper
  title: string;
  message: string;
  type: "DELAY_ALERT" | "STATUS_UPDATE" | "ARRIVAL" | "BOOKING_ALERT";
  mealType?: string | null;
  createdAt: Date | string;
}

export interface DashboardStats {
  todayTotal: number;
  completed: number;
  delayed: number;
  pending: number;
  todayMeals: number;
  todayBookings: number;
  collectedCount: number;
  pendingCollectionCount: number;
}

export interface DeliveryFilters {
  date?: string;
  mealType?: string;
  status?: string;
}
