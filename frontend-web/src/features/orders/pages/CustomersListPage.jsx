import { useState, useEffect } from 'react';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import customerService from '../../../services/api/customerService';
import { Users, Plus, MapPin, Navigation, ExternalLink, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

const SRI_LANKA_CITIES = [
  { name: 'Colombo 03 (Kollupitiya)', lat: 6.9034, lng: 79.8517 },
  { name: 'Colombo 04 (Bambalapitiya)', lat: 6.8905, lng: 79.8596 },
  { name: 'Colombo 07 (Cinnamon Gardens)', lat: 6.9064, lng: 79.8708 },
  { name: 'Kandy City Center', lat: 7.2906, lng: 80.6337 },
  { name: 'Galle Fort', lat: 6.0535, lng: 80.2210 },
  { name: 'Jaffna Town', lat: 9.6615, lng: 80.0255 },
  { name: 'Negombo Beach Road', lat: 7.2088, lng: 79.8358 },
  { name: 'Gampaha Town', lat: 7.0917, lng: 79.9998 },
  { name: 'Kurunegala City', lat: 7.4863, lng: 80.3623 },
  { name: 'Matara Fort', lat: 5.9496, lng: 80.5353 },
];

function findClosestCity(lat, lng) {
  let closest = SRI_LANKA_CITIES[0];
  let minDistance = Infinity;
  for (const city of SRI_LANKA_CITIES) {
    const d = Math.hypot(city.lat - lat, city.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }
  return closest;
}

export default function CustomersListPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedPresetCity, setSelectedPresetCity] = useState('');
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Current Location GPS capture + Auto City fill
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const latStr = lat.toFixed(6);
        const lngStr = lng.toFixed(6);

        // Find closest Sri Lankan city preset
        const closest = findClosestCity(lat, lng);
        const detectedCity = closest ? closest.name.split(' (')[0] : 'Colombo';

        setSelectedPresetCity(closest ? closest.name : '');
        setForm((prev) => ({
          ...prev,
          city: detectedCity,
          latitude: latStr,
          longitude: lngStr,
        }));

        setGettingLocation(false);
        toast.success(`📍 Location detected: ${detectedCity} (${latStr}, ${lngStr})`);
      },
      (err) => {
        console.error('GPS error:', err);
        setGettingLocation(false);
        toast.error('Unable to retrieve GPS. Please check browser location permissions or pick a city preset.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // City preset selection
  const handleCityPresetChange = (e) => {
    const cityName = e.target.value;
    setSelectedPresetCity(cityName);
    const selectedCity = SRI_LANKA_CITIES.find((c) => c.name === cityName);
    if (selectedCity) {
      setForm((prev) => ({
        ...prev,
        city: selectedCity.name.split(' (')[0],
        latitude: selectedCity.lat.toString(),
        longitude: selectedCity.lng.toString(),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await customerService.create({
        name: form.companyName.trim(),
        contactPerson: form.contactPerson?.trim() || null,
        phone: form.phone?.trim() || '',
        email: form.email?.trim() || '',
        address: form.address?.trim() || '',
        city: form.city?.trim() || '',
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      toast.success('Customer registered successfully');
      setShowModal(false);
      setForm({
        companyName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        latitude: '',
        longitude: '',
      });
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'company',
      header: 'Company / Outlet',
      accessor: (row) => row.name || row.companyName || '—',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <span className="font-medium text-stone-900 block">{row.name || row.companyName}</span>
            <span className="text-xs text-stone-500">{row.address || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Person',
      accessor: 'contactPerson',
      render: (row) => <span className="text-stone-800">{row.contactPerson || '—'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: 'phone',
      render: (row) => (
        <span className="font-mono text-xs text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/70">
          {row.phone || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      accessor: 'email',
      render: (row) => <span className="text-indigo-600 text-xs hover:underline cursor-pointer">{row.email || '—'}</span>,
    },
    {
      key: 'city',
      header: 'City / Province',
      accessor: 'city',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-stone-700 font-medium">
          {row.city || 'Colombo'}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'GPS Geotag',
      sortable: false,
      render: (row) => (
        row.latitude && row.longitude ? (
          <a
            href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50/90 hover:bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-200/80 transition-all font-mono font-medium shadow-2xs group"
            title="Open precise location on Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
            <span>{parseFloat(row.latitude).toFixed(4)}, {parseFloat(row.longitude).toFixed(4)}</span>
            <ExternalLink className="w-2.5 h-2.5 text-emerald-500 opacity-60 group-hover:opacity-100" />
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-stone-400 font-mono">
            <MapPin className="w-3 h-3 text-stone-300" />
            <span>No GPS</span>
          </span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Customer Directory</h1>
          <p className="text-sm text-stone-500 mt-0.5">{customers.length} registered outlets & clients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search customers by name, city, phone..."
      />

      {/* Register Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Customer Outlet"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="customer-form"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
            >
              {saving ? 'Registering...' : 'Register Customer'}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Company / Outlet Name *</label>
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
                placeholder="e.g. Lanka Supermarket Pvt Ltd"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Contact Person</label>
              <input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="e.g. Kasun Perera"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="e.g. +94 77 123 4567"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. store@lankasuper.lk"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Street Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. 142 Galle Road, Kollupitiya"
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* GPS Location & Quick Preset Helpers */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" /> GPS Geotagging Helper
              </span>

              {/* 1-Click Current Location */}
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={gettingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition shadow-sm"
              >
                <Navigation className="w-3 h-3" />
                {gettingLocation ? 'Detecting GPS...' : '📍 Use Current Location'}
              </button>
            </div>

            {/* City Quick Preset Selector */}
            <div>
              <label className="block text-xs text-stone-500 mb-1">Or Pick a City Preset (Auto-fills Coordinates):</label>
              <select
                value={selectedPresetCity}
                onChange={handleCityPresetChange}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Select a city to auto-fill GPS coordinates...</option>
                {SRI_LANKA_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} — ({c.lat}, {c.lng})
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinate Inputs */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Colombo"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="6.9271"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="79.8612"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
