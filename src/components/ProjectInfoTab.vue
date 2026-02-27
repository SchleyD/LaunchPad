<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Project } from '@/types'

interface Site {
  id: string
  projectId: string
  siteName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zip: string
  isShippingAddress: boolean
  hasLoadingDock: boolean | null
  freightBrokerInfo: string
  scalePcLocation: string
  notes: string
}

interface NetworkDevice {
  id: string
  siteId: string
  deviceType: 'Kiosk' | 'Relay' | 'Intercom' | 'Camera' | 'CardReader' | 'Other'
  deviceName: string
  ipAddress: string
  subnetMask: string
  gateway: string
  dnsPrimary: string
  dnsSecondary: string
  sipExtension: string
  notes: string
}

interface Contact {
  id: string
  projectId: string
  contactType: 'Main' | 'IT' | 'Electrician' | 'ScaleDealer' | 'Other'
  name: string
  email: string
  phone: string
  notes: string
}

const props = defineProps<{
  project: Project
}>()

// State
const isLoading = ref(false)
const sites = ref<Site[]>([])
const devices = ref<NetworkDevice[]>([])
const contacts = ref<Contact[]>([])

// Modal state
const showSiteModal = ref(false)
const showDeviceModal = ref(false)
const showContactModal = ref(false)
const editingSite = ref<Site | null>(null)
const editingDevice = ref<NetworkDevice | null>(null)
const editingContact = ref<Contact | null>(null)
const selectedSiteId = ref<string | null>(null)

// Form data
const siteForm = ref({
  siteName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  isShippingAddress: false,
  hasLoadingDock: null as boolean | null,
  freightBrokerInfo: '',
  scalePcLocation: '',
  notes: ''
})

const deviceForm = ref({
  siteId: '',
  deviceType: 'Kiosk' as NetworkDevice['deviceType'],
  deviceName: '',
  ipAddress: '',
  subnetMask: '255.255.255.0',
  gateway: '',
  dnsPrimary: '',
  dnsSecondary: '',
  sipExtension: '',
  notes: ''
})

const contactForm = ref({
  contactType: 'Main' as Contact['contactType'],
  name: '',
  email: '',
  phone: '',
  notes: ''
})

// Computed
const devicesBySite = computed(() => {
  const grouped: Record<string, NetworkDevice[]> = {}
  for (const site of sites.value) {
    grouped[site.id] = devices.value.filter(d => d.siteId === site.id)
  }
  return grouped
})

const shippingSite = computed(() => {
  return sites.value.find(s => s.isShippingAddress)
})

// Load data
async function loadData() {
  if (!isSupabaseConfigured || !supabase) return
  
  isLoading.value = true
  try {
    // Load sites
    const { data: sitesData } = await supabase
      .from('project_sites')
      .select('*')
      .eq('project_id', props.project.id)
      .order('site_name')
    
    sites.value = (sitesData || []).map(s => ({
      id: s.id,
      projectId: s.project_id,
      siteName: s.site_name,
      addressLine1: s.address_line1 || '',
      addressLine2: s.address_line2 || '',
      city: s.city || '',
      state: s.state || '',
      zip: s.zip || '',
      isShippingAddress: s.is_shipping_address || false,
      hasLoadingDock: s.has_loading_dock,
      freightBrokerInfo: s.freight_broker_info || '',
      scalePcLocation: s.scale_pc_location || '',
      notes: s.notes || ''
    }))

    // Load devices for all sites
    if (sites.value.length > 0) {
      const siteIds = sites.value.map(s => s.id)
      const { data: devicesData } = await supabase
        .from('network_devices')
        .select('*')
        .in('site_id', siteIds)
        .order('device_name')
      
      devices.value = (devicesData || []).map(d => ({
        id: d.id,
        siteId: d.site_id,
        deviceType: d.device_type,
        deviceName: d.device_name || '',
        ipAddress: d.ip_address || '',
        subnetMask: d.subnet_mask || '',
        gateway: d.gateway || '',
        dnsPrimary: d.dns_primary || '',
        dnsSecondary: d.dns_secondary || '',
        sipExtension: d.sip_extension || '',
        notes: d.notes || ''
      }))
    }

    // Load contacts
    const { data: contactsData } = await supabase
      .from('project_contacts')
      .select('*')
      .eq('project_id', props.project.id)
      .order('contact_type')
    
    contacts.value = (contactsData || []).map(c => ({
      id: c.id,
      projectId: c.project_id,
      contactType: c.contact_type,
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      notes: c.notes || ''
    }))
  } catch (error) {
    console.error('[v0] Failed to load project info:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

// Site CRUD
function openAddSite() {
  editingSite.value = null
  siteForm.value = {
    siteName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    isShippingAddress: sites.value.length === 0,
    hasLoadingDock: null,
    freightBrokerInfo: '',
    scalePcLocation: '',
    notes: ''
  }
  showSiteModal.value = true
}

function openEditSite(site: Site) {
  editingSite.value = site
  siteForm.value = { ...site }
  showSiteModal.value = true
}

async function saveSite() {
  if (!isSupabaseConfigured || !supabase) return
  
  try {
    const siteData = {
      project_id: props.project.id,
      site_name: siteForm.value.siteName,
      address_line1: siteForm.value.addressLine1 || null,
      address_line2: siteForm.value.addressLine2 || null,
      city: siteForm.value.city || null,
      state: siteForm.value.state || null,
      zip: siteForm.value.zip || null,
      is_shipping_address: siteForm.value.isShippingAddress,
      has_loading_dock: siteForm.value.hasLoadingDock,
      freight_broker_info: siteForm.value.freightBrokerInfo || null,
      scale_pc_location: siteForm.value.scalePcLocation || null,
      notes: siteForm.value.notes || null
    }

    // If marking as shipping address, unmark others
    if (siteForm.value.isShippingAddress) {
      await supabase
        .from('project_sites')
        .update({ is_shipping_address: false })
        .eq('project_id', props.project.id)
    }

    if (editingSite.value) {
      await supabase
        .from('project_sites')
        .update(siteData)
        .eq('id', editingSite.value.id)
    } else {
      await supabase
        .from('project_sites')
        .insert(siteData)
    }
    
    await loadData()
    showSiteModal.value = false
  } catch (error) {
    console.error('[v0] Failed to save site:', error)
  }
}

async function deleteSite(site: Site) {
  if (!confirm(`Delete site "${site.siteName}" and all its devices?`)) return
  if (!isSupabaseConfigured || !supabase) return
  
  try {
    await supabase.from('project_sites').delete().eq('id', site.id)
    await loadData()
  } catch (error) {
    console.error('[v0] Failed to delete site:', error)
  }
}

// Device CRUD
function openAddDevice(siteId: string) {
  editingDevice.value = null
  selectedSiteId.value = siteId
  deviceForm.value = {
    siteId,
    deviceType: 'Kiosk',
    deviceName: '',
    ipAddress: '',
    subnetMask: '255.255.255.0',
    gateway: '',
    dnsPrimary: '',
    dnsSecondary: '',
    sipExtension: '',
    notes: ''
  }
  showDeviceModal.value = true
}

function openEditDevice(device: NetworkDevice) {
  editingDevice.value = device
  deviceForm.value = { ...device }
  showDeviceModal.value = true
}

async function saveDevice() {
  if (!isSupabaseConfigured || !supabase) return
  
  try {
    const deviceData = {
      site_id: deviceForm.value.siteId,
      device_type: deviceForm.value.deviceType,
      device_name: deviceForm.value.deviceName || null,
      ip_address: deviceForm.value.ipAddress || null,
      subnet_mask: deviceForm.value.subnetMask || null,
      gateway: deviceForm.value.gateway || null,
      dns_primary: deviceForm.value.dnsPrimary || null,
      dns_secondary: deviceForm.value.dnsSecondary || null,
      sip_extension: deviceForm.value.sipExtension || null,
      notes: deviceForm.value.notes || null
    }

    if (editingDevice.value) {
      await supabase
        .from('network_devices')
        .update(deviceData)
        .eq('id', editingDevice.value.id)
    } else {
      await supabase
        .from('network_devices')
        .insert(deviceData)
    }
    
    await loadData()
    showDeviceModal.value = false
  } catch (error) {
    console.error('[v0] Failed to save device:', error)
  }
}

async function deleteDevice(device: NetworkDevice) {
  if (!confirm(`Delete device "${device.deviceName || device.deviceType}"?`)) return
  if (!isSupabaseConfigured || !supabase) return
  
  try {
    await supabase.from('network_devices').delete().eq('id', device.id)
    await loadData()
  } catch (error) {
    console.error('[v0] Failed to delete device:', error)
  }
}

// Contact CRUD
function openAddContact() {
  editingContact.value = null
  contactForm.value = {
    contactType: 'Main',
    name: '',
    email: '',
    phone: '',
    notes: ''
  }
  showContactModal.value = true
}

function openEditContact(contact: Contact) {
  editingContact.value = contact
  contactForm.value = { ...contact }
  showContactModal.value = true
}

async function saveContact() {
  if (!isSupabaseConfigured || !supabase) return
  
  try {
    const contactData = {
      project_id: props.project.id,
      contact_type: contactForm.value.contactType,
      name: contactForm.value.name,
      email: contactForm.value.email || null,
      phone: contactForm.value.phone || null,
      notes: contactForm.value.notes || null
    }

    if (editingContact.value) {
      await supabase
        .from('project_contacts')
        .update(contactData)
        .eq('id', editingContact.value.id)
    } else {
      await supabase
        .from('project_contacts')
        .insert(contactData)
    }
    
    await loadData()
    showContactModal.value = false
  } catch (error) {
    console.error('[v0] Failed to save contact:', error)
  }
}

async function deleteContact(contact: Contact) {
  if (!confirm(`Delete contact "${contact.name}"?`)) return
  if (!isSupabaseConfigured || !supabase) return
  
  try {
    await supabase.from('project_contacts').delete().eq('id', contact.id)
    await loadData()
  } catch (error) {
    console.error('[v0] Failed to delete contact:', error)
  }
}

function getDeviceTypeIcon(type: string): string {
  switch (type) {
    case 'Kiosk': return 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0'
    case 'Camera': return 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
    case 'Intercom': return 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
    case 'Relay': return 'M13 10V3L4 14h7v7l9-11h-7z'
    case 'CardReader': return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    default: return 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
  }
}

function getContactTypeLabel(type: string): string {
  switch (type) {
    case 'Main': return 'Main Contact'
    case 'IT': return 'IT Contact'
    case 'Electrician': return 'Electrician'
    case 'ScaleDealer': return 'Scale Dealer'
    default: return type
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- Shipping Address Summary -->
      <div v-if="shippingSite" class="card p-4 border-l-4 border-l-primary-500">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-1">Ship To Address</h3>
            <p class="font-medium text-surface-900">{{ shippingSite.siteName }}</p>
            <p class="text-sm text-surface-600">
              {{ shippingSite.addressLine1 }}
              <template v-if="shippingSite.addressLine2">, {{ shippingSite.addressLine2 }}</template>
            </p>
            <p class="text-sm text-surface-600">
              {{ shippingSite.city }}, {{ shippingSite.state }} {{ shippingSite.zip }}
            </p>
            <p v-if="shippingSite.hasLoadingDock !== null" class="text-xs text-surface-500 mt-1">
              {{ shippingSite.hasLoadingDock ? 'Has loading dock' : 'No loading dock' }}
            </p>
          </div>
          <span class="badge badge-primary">Shipping</span>
        </div>
      </div>

      <!-- Sites Section -->
      <div class="card">
        <div class="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
          <h3 class="font-semibold text-surface-900">Sites</h3>
          <button 
            @click="openAddSite"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Site
          </button>
        </div>

        <div v-if="sites.length === 0" class="px-4 py-8 text-center text-surface-500">
          <p>No sites added yet. Add a site to track addresses and network devices.</p>
        </div>

        <div v-else class="divide-y divide-surface-100">
          <div v-for="site in sites" :key="site.id" class="p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-medium text-surface-900">{{ site.siteName }}</h4>
                  <span v-if="site.isShippingAddress" class="badge badge-primary text-xs">Shipping</span>
                </div>
                <p v-if="site.addressLine1" class="text-sm text-surface-600 mt-0.5">
                  {{ site.addressLine1 }}{{ site.city ? `, ${site.city}, ${site.state} ${site.zip}` : '' }}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <button 
                  @click="openEditSite(site)"
                  class="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  @click="deleteSite(site)"
                  class="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Network Devices for this site -->
            <div class="mt-3 pt-3 border-t border-surface-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Network Devices</span>
                <button 
                  @click="openAddDevice(site.id)"
                  class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Add Device
                </button>
              </div>
              
              <div v-if="devicesBySite[site.id]?.length === 0" class="text-sm text-surface-400 italic">
                No devices configured
              </div>
              
              <div v-else class="space-y-2">
                <div 
                  v-for="device in devicesBySite[site.id]" 
                  :key="device.id"
                  class="flex items-center justify-between bg-surface-50 rounded-lg px-3 py-2"
                >
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="getDeviceTypeIcon(device.deviceType)" />
                    </svg>
                    <div>
                      <span class="text-sm font-medium text-surface-900">
                        {{ device.deviceName || device.deviceType }}
                      </span>
                      <span class="text-xs text-surface-500 ml-2">{{ device.deviceType }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span v-if="device.ipAddress" class="font-mono text-sm text-surface-600">
                      {{ device.ipAddress }}
                    </span>
                    <div class="flex items-center gap-1">
                      <button 
                        @click="openEditDevice(device)"
                        class="p-1 text-surface-400 hover:text-surface-600"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        @click="deleteDevice(device)"
                        class="p-1 text-surface-400 hover:text-red-600"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contacts Section -->
      <div class="card">
        <div class="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
          <h3 class="font-semibold text-surface-900">Contacts</h3>
          <button 
            @click="openAddContact"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>

        <div v-if="contacts.length === 0" class="px-4 py-8 text-center text-surface-500">
          <p>No contacts added yet.</p>
        </div>

        <div v-else class="divide-y divide-surface-100">
          <div v-for="contact in contacts" :key="contact.id" class="px-4 py-3 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium text-surface-900">{{ contact.name }}</span>
                <span class="badge text-xs" :class="contact.contactType === 'Main' ? 'badge-primary' : 'bg-surface-100 text-surface-600'">
                  {{ getContactTypeLabel(contact.contactType) }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-sm text-surface-500 mt-0.5">
                <span v-if="contact.email">{{ contact.email }}</span>
                <span v-if="contact.phone">{{ contact.phone }}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button 
                @click="openEditContact(contact)"
                class="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                @click="deleteContact(contact)"
                class="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Site Modal -->
    <div v-if="showSiteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showSiteModal = false">
      <div class="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-surface-200">
          <h3 class="text-lg font-semibold text-surface-900">
            {{ editingSite ? 'Edit Site' : 'Add Site' }}
          </h3>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Site Name *</label>
            <input v-model="siteForm.siteName" type="text" class="input w-full" placeholder="e.g., Main Office, North Scale" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-surface-700 mb-1">Address Line 1</label>
              <input v-model="siteForm.addressLine1" type="text" class="input w-full" placeholder="Street address" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-surface-700 mb-1">Address Line 2</label>
              <input v-model="siteForm.addressLine2" type="text" class="input w-full" placeholder="Suite, unit, etc." />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">City</label>
              <input v-model="siteForm.city" type="text" class="input w-full" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">State</label>
                <input v-model="siteForm.state" type="text" class="input w-full" maxlength="2" placeholder="WI" />
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">ZIP</label>
                <input v-model="siteForm.zip" type="text" class="input w-full" />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="siteForm.isShippingAddress" class="w-4 h-4 text-primary-600 rounded" />
              <span class="text-sm text-surface-700">Use as shipping address</span>
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Loading Dock</label>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" :value="true" v-model="siteForm.hasLoadingDock" class="w-4 h-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" :value="false" v-model="siteForm.hasLoadingDock" class="w-4 h-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" :value="null" v-model="siteForm.hasLoadingDock" class="w-4 h-4 text-primary-600" />
                <span class="text-sm">Unknown</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Freight Broker Info</label>
            <input v-model="siteForm.freightBrokerInfo" type="text" class="input w-full" placeholder="Broker name/number if applicable" />
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Scale PC Location</label>
            <input v-model="siteForm.scalePcLocation" type="text" class="input w-full" placeholder="Where will the scale PC be located?" />
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Notes</label>
            <textarea v-model="siteForm.notes" rows="2" class="input w-full resize-none"></textarea>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-surface-200 flex justify-end gap-3">
          <button @click="showSiteModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="saveSite" :disabled="!siteForm.siteName" class="btn btn-primary">
            {{ editingSite ? 'Save Changes' : 'Add Site' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Device Modal -->
    <div v-if="showDeviceModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showDeviceModal = false">
      <div class="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-surface-200">
          <h3 class="text-lg font-semibold text-surface-900">
            {{ editingDevice ? 'Edit Device' : 'Add Device' }}
          </h3>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">Device Type *</label>
              <select v-model="deviceForm.deviceType" class="select w-full">
                <option value="Kiosk">Kiosk</option>
                <option value="Relay">Relay</option>
                <option value="Intercom">Intercom</option>
                <option value="Camera">Camera</option>
                <option value="CardReader">Card Reader</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">Device Name</label>
              <input v-model="deviceForm.deviceName" type="text" class="input w-full" placeholder="e.g., Kiosk 1, North Camera" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">IP Address</label>
              <input v-model="deviceForm.ipAddress" type="text" class="input w-full font-mono" placeholder="192.168.1.100" />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">Subnet Mask</label>
              <input v-model="deviceForm.subnetMask" type="text" class="input w-full font-mono" placeholder="255.255.255.0" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">Gateway</label>
              <input v-model="deviceForm.gateway" type="text" class="input w-full font-mono" placeholder="192.168.1.1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">DNS Primary</label>
              <input v-model="deviceForm.dnsPrimary" type="text" class="input w-full font-mono" placeholder="8.8.8.8" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">DNS Secondary</label>
              <input v-model="deviceForm.dnsSecondary" type="text" class="input w-full font-mono" placeholder="8.8.4.4" />
            </div>
            <div v-if="deviceForm.deviceType === 'Intercom'">
              <label class="block text-sm font-medium text-surface-700 mb-1">SIP Extension</label>
              <input v-model="deviceForm.sipExtension" type="text" class="input w-full" placeholder="101" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Notes</label>
            <textarea v-model="deviceForm.notes" rows="2" class="input w-full resize-none"></textarea>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-surface-200 flex justify-end gap-3">
          <button @click="showDeviceModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="saveDevice" class="btn btn-primary">
            {{ editingDevice ? 'Save Changes' : 'Add Device' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Contact Modal -->
    <div v-if="showContactModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showContactModal = false">
      <div class="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
        <div class="px-6 py-4 border-b border-surface-200">
          <h3 class="text-lg font-semibold text-surface-900">
            {{ editingContact ? 'Edit Contact' : 'Add Contact' }}
          </h3>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Contact Type *</label>
            <select v-model="contactForm.contactType" class="select w-full">
              <option value="Main">Main Contact</option>
              <option value="IT">IT Contact</option>
              <option value="Electrician">Electrician</option>
              <option value="ScaleDealer">Scale Dealer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Name *</label>
            <input v-model="contactForm.name" type="text" class="input w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Email</label>
            <input v-model="contactForm.email" type="email" class="input w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Phone</label>
            <input v-model="contactForm.phone" type="tel" class="input w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1">Notes</label>
            <textarea v-model="contactForm.notes" rows="2" class="input w-full resize-none"></textarea>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-surface-200 flex justify-end gap-3">
          <button @click="showContactModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="saveContact" :disabled="!contactForm.name" class="btn btn-primary">
            {{ editingContact ? 'Save Changes' : 'Add Contact' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
