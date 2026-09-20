import { IRAN_PROVINCES, getIranProvince } from "../data/iranLocations";

type Props = {
  province: string;
  city: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function IranAddressFields({ province, city, onProvinceChange, onCityChange, disabled, required = false, className = "" }: Props) {
  const selectedProvince = getIranProvince(province);
  const cities = selectedProvince?.cities ?? [];
  const legacyProvince = province && !selectedProvince;
  const legacyCity = city && !cities.includes(city);

  return (
    <>
      <div className={className}>
        <label className="mb-2 block text-sm font-medium text-gray-700">استان{required ? <span className="mr-1 text-red-600">*</span> : null}</label>
        <select value={province} onChange={(e) => { onProvinceChange(e.target.value); onCityChange(""); }} disabled={disabled} required={required} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100">
          <option value="">انتخاب استان</option>
          {legacyProvince ? <option value={province}>مقدار ثبت‌شده قدیمی: {province}</option> : null}
          {IRAN_PROVINCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className={className}>
        <label className="mb-2 block text-sm font-medium text-gray-700">شهر{required ? <span className="mr-1 text-red-600">*</span> : null}</label>
        <select value={city} onChange={(e) => onCityChange(e.target.value)} disabled={disabled || !selectedProvince} required={required} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100">
          <option value="">{selectedProvince ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}</option>
          {legacyCity ? <option value={city}>مقدار ثبت‌شده قدیمی: {city}</option> : null}
          {cities.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </>
  );
}
