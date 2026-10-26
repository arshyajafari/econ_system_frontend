import { useEffect } from "react";
import { getIranProvince } from "../data/iranLocations";

const FIXED_PROVINCE = "مازندران";

type Props = {
  province: string;
  city: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function IranAddressFields({
  province,
  city,
  onProvinceChange,
  onCityChange,
  disabled,
  required = false,
  className = "",
}: Props) {
  const selectedProvince = getIranProvince(FIXED_PROVINCE);
  const cities = selectedProvince?.cities ?? [];

  useEffect(() => {
    if (province !== FIXED_PROVINCE) {
      onProvinceChange(FIXED_PROVINCE);
      onCityChange("");
      return;
    }

    if (city && !cities.includes(city)) onCityChange("");
  }, [province, city, cities, onProvinceChange, onCityChange]);



  return (
    <>
      <div className={className}>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          استان
          {required && <span className="mr-1 text-red-600">*</span>}
        </label>

        <select
          value={FIXED_PROVINCE}
          disabled
          required={required}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
        >
          <option value={FIXED_PROVINCE}>{FIXED_PROVINCE}</option>
        </select>
      </div>

      <div className={className}>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          شهر
          {required && <span className="mr-1 text-red-600">*</span>}
        </label>

        <select
          value={city ?? ""}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={disabled || !selectedProvince}
          required={required}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
        >
          <option value="">
            {selectedProvince ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}
          </option>

          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
