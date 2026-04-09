import React, { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "react-hot-toast";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload"; 
import DocumentUpload from "@/components/profile/DocumentUpload";
import { LocationSearch } from "@/components/ui/location-search";
import { supabase } from "@/integrations/supabase/client";
import { ProviderService } from '@/services/providerService';
import { useAuth } from "@/contexts/AuthContext";

const ProviderSignup = () => {
  const { toast: uiToast } = useToast();
  const [date, setDate] = useState<Date>();
  const [serviceType, setServiceType] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [governmentId, setGovernmentId] = useState<string | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<string | null>(null);
  const [resume, setResume] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    idType: "",
    idNumber: "",
    experience: "",
    languages: "",
    skills: "",
    serviceType: "",
    drivingLicenseNumber: "",
    vehicleType: "",
    licenseExpiryDate: "",
    city: "",
    area: "",
    liveLocation: false,
    workingHoursFrom: "",
    workingHoursTo: "",
    bankAccountName: "",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",
    termsAccepted: false
  });

  const { setUserType } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "serviceType") {
      setServiceType(value);
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleLocationSelect = (placeId: string, address: string) => {
    console.log("Selected location:", address, "Place ID:", placeId);
    setLocation(address);
    setFormData(prev => ({ ...prev, area: address }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('=== SIGNUP PROCESS STARTED ===');
      
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate terms acceptance
      if (!formData.termsAccepted) {
        toast.error('Please accept the terms and conditions');
        setLoading(false);
        return;
      }

      // First create the auth user
      console.log('Creating auth user with:', { email: formData.email });
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: 'provider',
            phone: formData.phone
          }
        }
      });

      if (signUpError || !authData.user) {
        console.error('Auth signup error:', signUpError);
        throw signUpError || new Error('Failed to create user');
      }

      const userId = authData.user.id;
      console.log('Auth user created:', userId);

      // Prepare provider data
      const providerData = {
        user_id: userId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.area ? `${formData.city}, ${formData.area}` : formData.city,
        service_type: formData.serviceType,
        experience_years: parseInt(formData.experience) || 0,
        skills: formData.skills,
        govt_id_url: governmentId,
        license_url: drivingLicense,
        profile_picture: profilePicture,
        languages: formData.languages,
        id_type: formData.idType,
        id_number: formData.idNumber,
        driving_license_number: formData.drivingLicenseNumber,
        vehicle_type: formData.vehicleType,
        license_expiry_date: formData.licenseExpiryDate,
        working_hours_from: formData.workingHoursFrom,
        working_hours_to: formData.workingHoursTo,
        bank_account_name: formData.bankAccountName,
        bank_account_number: formData.bankAccountNumber,
        ifsc_code: formData.ifscCode,
        upi_id: formData.upiId,
        resume_url: resume,
        status: 'pending',
        is_online: false,
        is_approved: false
      };

      console.log('Attempting to insert provider data:', providerData);

      // Try inserting with service_role client to bypass RLS
      const serviceRoleClient = supabase.auth.admin;
      
      const { data: insertedData, error: insertError } = await supabase
        .from('provider_details')
        .insert(providerData)
        .select()
        .single();

      if (insertError) {
        console.error('Provider data insertion failed:', insertError);
        
        // If insert fails, try direct SQL insert
        const { error: sqlError } = await supabase.rpc('insert_provider_details', {
          provider_data: providerData
        });

        if (sqlError) {
          console.error('SQL insert failed:', sqlError);
          throw new Error(`Failed to create provider profile: ${sqlError.message}`);
        }
      }


      console.log('Provider signup completed successfully');

      // Crucial: Set the user type in context before navigating
      setUserType('provider');

      toast.success('Account created successfully! Please check your email for verification.');
      localStorage.setItem("cura-user", JSON.stringify({ 
        role: "provider",
        id: userId,
        email: formData.email 
      }));

      navigate('/provider/dashboard');
    } catch (error) {
      console.error('=== SIGNUP PROCESS FAILED ===');
      console.error('Error details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Register as Service Provider"
      description="Fill in the details below to create your service provider account"
      footer={
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/provider/login" className="text-cura-primary font-semibold hover:underline">
            Log in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input 
              id="fullName" 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleInputChange} 
              placeholder="Enter your full name"
              required 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="dob">Date of Birth *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {date ? format(date, "PPP") : <span>Select your date of birth</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1940}
                  toYear={2006} // 18 years ago
                  disabled={(date) => {
                    const eighteenYearsAgo = new Date();
                    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
                    return date > eighteenYearsAgo || date < new Date("1940-01-01");
                  }}
                  classNames={{
                    dropdown_month: "w-full",
                    dropdown_year: "w-full",
                    dropdown: "p-2"
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select onValueChange={(value) => handleSelectChange("gender", value)}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input 
              id="phone" 
              name="phone" 
              value={formData.phone} 
              onChange={handleInputChange} 
              type="tel"
              placeholder="Enter your phone number"
              required 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              name="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              type="email"
              placeholder="Enter your email address"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password *</Label>
            <Input 
              id="password" 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange} 
              type="password"
              placeholder="Create a password"
              required 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleInputChange} 
              type="password"
              placeholder="Confirm your password"
              required 
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Profile Picture</Label>
            <ProfileImageUpload 
              currentImageUrl={profilePicture}
              userId={"signup-" + formData.email}  // Using email as placeholder ID for signup form
              onImageUploaded={url => setProfilePicture(url)}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Identity Verification</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="idType">ID Type *</Label>
            <Select onValueChange={(value) => handleSelectChange("idType", value)} required>
              <SelectTrigger id="idType">
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aadhar">Aadhar Card</SelectItem>
                <SelectItem value="pan">PAN Card</SelectItem>
                <SelectItem value="drivingLicense">Driving License</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="idNumber">ID Number *</Label>
            <Input 
              id="idNumber" 
              name="idNumber" 
              value={formData.idNumber} 
              onChange={handleInputChange} 
              placeholder="Enter your ID number"
              required 
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Upload Government ID *</Label>
            <DocumentUpload 
              documentUrl={governmentId}
              documentType="Government ID"
              userId={"signup-" + formData.email}  // Using email as placeholder ID for signup form
              onDocumentUploaded={url => setGovernmentId(url)}
              allowedFileTypes={[".jpg", ".jpeg", ".png", ".pdf"]}
              folder="gov_ids"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Professional Details</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="serviceType">Type of Service *</Label>
            <Select onValueChange={(value) => handleSelectChange("serviceType", value)} required>
              <SelectTrigger id="serviceType">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="nanny">Nanny</SelectItem>
                <SelectItem value="caretaker">Caretaker</SelectItem>
                <SelectItem value="chef">Chef</SelectItem>
                <SelectItem value="houseHelper">House Helper</SelectItem>
                <SelectItem value="parcelDelivery">Parcel Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="experience">Experience (Years) *</Label>
            <Input 
              id="experience" 
              name="experience" 
              value={formData.experience} 
              onChange={handleInputChange} 
              type="number"
              min="0"
              max="50"
              placeholder="Enter years of experience"
              required 
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Upload Resume or Experience Proof</Label>
            <DocumentUpload 
              documentUrl={resume}
              documentType="Resume"
              userId={"signup-" + formData.email}  // Using email as placeholder ID for signup form
              onDocumentUploaded={url => setResume(url)}
              allowedFileTypes={[".pdf", ".doc", ".docx"]}
              folder="resumes"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="languages">Languages Known</Label>
            <Input 
              id="languages" 
              name="languages" 
              value={formData.languages} 
              onChange={handleInputChange} 
              placeholder="E.g., English, Hindi, Tamil (comma separated)"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="skills">Skills/Certifications</Label>
            <Textarea 
              id="skills" 
              name="skills" 
              value={formData.skills} 
              onChange={handleInputChange} 
              placeholder="List your skills or certifications"
              rows={3}
            />
          </div>
        </div>
        
        {serviceType === "driver" && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">Driver-Specific Details</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="drivingLicenseNumber">Driving License Number *</Label>
              <Input 
                id="drivingLicenseNumber" 
                name="drivingLicenseNumber" 
                value={formData.drivingLicenseNumber} 
                onChange={handleInputChange} 
                placeholder="Enter driving license number"
                required 
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Upload Driving License *</Label>
              <DocumentUpload 
                documentUrl={drivingLicense}
                documentType="Driving License"
                userId={"signup-" + formData.email}  // Using email as placeholder ID for signup form
                onDocumentUploaded={url => setDrivingLicense(url)}
                allowedFileTypes={[".jpg", ".jpeg", ".png", ".pdf"]}
                folder="licenses"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Select onValueChange={(value) => handleSelectChange("vehicleType", value)} required>
                <SelectTrigger id="vehicleType">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2wheeler">2-wheeler</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="licenseExpiryDate">License Expiry Date *</Label>
              <Input 
                id="licenseExpiryDate" 
                name="licenseExpiryDate" 
                value={formData.licenseExpiryDate} 
                onChange={handleInputChange} 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                required 
              />
            </div>
          </div>
        )}
        
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-lg">Location & Availability</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="city">Current City *</Label>
            <Input 
              id="city" 
              name="city" 
              value={formData.city} 
              onChange={handleInputChange} 
              placeholder="Enter your city"
              required 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="area">Area/Locality *</Label>
            <LocationSearch 
              value={location}
              onChange={setLocation}
              placeholder="Search for your area/locality"
              onLocationSelect={handleLocationSelect}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="liveLocation" 
              checked={formData.liveLocation}
              onCheckedChange={(checked) => handleCheckboxChange("liveLocation", checked)} 
            />
            <Label htmlFor="liveLocation">Allow Live Location Access</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="workingHoursFrom">Working Hours (From)</Label>
              <Input 
                id="workingHoursFrom" 
                name="workingHoursFrom" 
                value={formData.workingHoursFrom} 
                onChange={handleInputChange} 
                type="time"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="workingHoursTo">Working Hours (To)</Label>
              <Input 
                id="workingHoursTo" 
                name="workingHoursTo" 
                value={formData.workingHoursTo} 
                onChange={handleInputChange} 
                type="time"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-lg">Bank/Payment Details (Optional)</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="bankAccountName">Account Holder Name</Label>
            <Input 
              id="bankAccountName" 
              name="bankAccountName" 
              value={formData.bankAccountName} 
              onChange={handleInputChange} 
              placeholder="Enter account holder name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
            <Input 
              id="bankAccountNumber" 
              name="bankAccountNumber" 
              value={formData.bankAccountNumber} 
              onChange={handleInputChange} 
              placeholder="Enter account number"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <Input 
              id="ifscCode" 
              name="ifscCode" 
              value={formData.ifscCode} 
              onChange={handleInputChange} 
              placeholder="Enter IFSC code"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input 
              id="upiId" 
              name="upiId" 
              value={formData.upiId} 
              onChange={handleInputChange} 
              placeholder="Enter UPI ID"
            />
          </div>
        </div>
        
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="termsAccepted" 
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => handleCheckboxChange("termsAccepted", checked === true)} 
            />
            <Label htmlFor="termsAccepted" className="text-sm">
              I agree to the Terms and Conditions and Privacy Policy
            </Label>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Register as Service Provider"}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
};

export default ProviderSignup;
