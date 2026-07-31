import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { Donor } from "@/types/donor";

const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

export type DonorSearchParams = {
  query?: string;
  blood_group?: string[];
  available?: boolean;
  verified?: boolean;
};

export async function searchDonors(
  params: DonorSearchParams,
): Promise<Donor[]> {
  const token = await AsyncStorage.getItem("auth_token");

  try {
    const res = await axios.get(`${BASE_URL}/donor_profiles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        blood_group: params.blood_group?.length
          ? params.blood_group
          : undefined,
        available: params.available || undefined,
        verified: params.verified || undefined,
      },
      // Rails expects blood_group[]=O+&blood_group[]=O- for array params
      paramsSerializer: {
        indexes: false,
      },
    });

    const donors = extractDonorsArray(res.data);
    const textFiltered = filterDonorsByText(donors, params.query);
    return filterDonorsByStructuredFields(textFiltered, params);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.log("Donor search error:", err.response?.data || err.message);
    } else {
      console.log("Donor search error:", err);
    }
    throw err;
  }
}


function extractDonorsArray(raw: any): Donor[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.donor_profiles)) return raw.donor_profiles;
  if (Array.isArray(raw?.donors)) return raw.donors;
  if (Array.isArray(raw?.data)) return raw.data;

  console.log(
    "searchDonors: unrecognized response shape, defaulting to []. Raw response was:",
    JSON.stringify(raw),
  );
  return [];
}

function filterDonorsByStructuredFields(
  donors: Donor[],
  params: DonorSearchParams,
): Donor[] {
  return donors.filter((d) => {
    if (params.blood_group?.length && !params.blood_group.includes(d.blood_group)) {
      return false;
    }
    if (params.available && !d.available) return false;
    if (params.verified && !d.verified) return false;
    return true;
  });
}

function filterDonorsByText(donors: Donor[], query?: string): Donor[] {
  const q = query?.trim().toLowerCase();
  if (!q) return donors ?? [];
  if (!Array.isArray(donors)) return [];

  return donors.filter((d) => {
    const haystacks = [
      d.user?.name,
      d.user?.phone_number,
      d.user?.email,
      d.location,
    ];
    return haystacks.some((field) =>
      field ? field.toLowerCase().includes(q) : false,
    );
  });
}

export type MyBloodRequest = {
  id: number;
  patient_name: string;
  blood_group: string;
  status: string;
  urgency: "normal" | "urgent" | "critical";
};

function isActiveStatus(status: string): boolean {
  return status !== "completed" && status !== "cancelled";
}

export async function fetchMyBloodRequests(): Promise<MyBloodRequest[]> {
  const token = await AsyncStorage.getItem("auth_token");
  const storedUser = await AsyncStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const res = await axios.get(`${BASE_URL}/blood_requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const all = res.data.blood_requests as any[];

  return all
    .filter((r) => r.user_id === user?.id && isActiveStatus(r.status))
    .map((r) => ({
      id: r.id,
      patient_name: r.patient_name,
      blood_group: r.blood_group,
      status: r.status,
      urgency: r.urgency,
    }));
}

export type SendDonationRequestResult = {
  id: number;
  status: string;
};

export async function sendDonationRequestToDonor(
  bloodRequestId: number,
  donorProfileId: number,
  message: string = "Can you accept please?",
): Promise<SendDonationRequestResult> {
  const token = await AsyncStorage.getItem("auth_token");

  const res = await axios.post(
    `${BASE_URL}/blood_donation_requests`,
    {
      blood_request_id: bloodRequestId,
      donor_profile_id: donorProfileId,
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  const id = res.data?.id ?? res.data?.donation_request?.id;
  const status =
    res.data?.status ?? res.data?.donation_request?.status ?? "pending";

  return { id, status };
}