import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000/api/v1";

const categories = [
  "Road Damage",
  "Water Leakage",
  "Garbage Overflow",
  "Street Light Issue",
  "Drainage Problem",
  "Public Toilet Issue",
  "Electricity Issue",
  "Footpath Issue",
  "Traffic Signal Issue"
];

export default function ReportIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissionInfo, setSubmissionInfo] = useState({
    totalSubmissions: 0,
    remainingSubmissions: 3,
    canSubmit: true
  });
  const [loadingSubmissionInfo, setLoadingSubmissionInfo] = useState(true);

  // Fetch user's submission count
  useEffect(() => {
    fetchSubmissionCount();
  }, []);

  const fetchSubmissionCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/incidents/user/submission-count`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmissionInfo(data.data);
      }
    } catch (error) {
      console.error("Error fetching submission count:", error);
    } finally {
      setLoadingSubmissionInfo(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          setError("Unable to get current location");
          console.error(error);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check if user can submit
    if (!submissionInfo.canSubmit) {
      setError("You have reached the maximum limit of 3 incident reports. Please wait for your existing reports to be resolved.");
      return;
    }

    // Validation
    if (!formData.title || !formData.category || !formData.address || !formData.latitude || !formData.longitude) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("latitude", formData.latitude);
      formDataToSend.append("longitude", formData.longitude);
      
      if (image) {
        formDataToSend.append("image", image);
      }

      const response = await fetch(`${API_URL}/incidents`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        alert("Incident reported successfully!");
        navigate("/user/dashboard");
      } else {
        setError(data.message || "Failed to submit incident");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to submit incident. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/user/dashboard")}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Report an Incident
          </h1>
          <p className="text-gray-600 text-lg">
            Help improve your community by reporting civic issues
          </p>
        </div>

        {/* Submission Limit Warning */}
        {!loadingSubmissionInfo && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${
            submissionInfo.canSubmit 
              ? "bg-blue-50 border-blue-200" 
              : "bg-red-50 border-red-300"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-lg ${
                  submissionInfo.canSubmit ? "text-blue-900" : "text-red-900"
                }`}>
                  Submission Limit
                </h3>
                <p className={submissionInfo.canSubmit ? "text-blue-700" : "text-red-700"}>
                  {submissionInfo.canSubmit 
                    ? `You have ${submissionInfo.remainingSubmissions} submission${submissionInfo.remainingSubmissions !== 1 ? 's' : ''} remaining out of 3`
                    : "You have reached the maximum limit of 3 submissions"
                  }
                </p>
              </div>
              <div className={`text-3xl font-bold px-6 py-3 rounded-xl ${
                submissionInfo.canSubmit 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-red-100 text-red-700"
              }`}>
                {submissionInfo.remainingSubmissions}/3
              </div>
            </div>
            {!submissionInfo.canSubmit && (
              <p className="mt-3 text-sm text-red-600 font-medium">
                💡 Tip: Once your existing reports are resolved, you'll be able to submit new incidents.
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!submissionInfo.canSubmit}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
                disabled={!submissionInfo.canSubmit}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide more details about the issue..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!submissionInfo.canSubmit}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address or landmark"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!submissionInfo.canSubmit}
              />
            </div>

            {/* Location Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Latitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="19.0760"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!submissionInfo.canSubmit}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Longitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="72.8777"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!submissionInfo.canSubmit}
                />
              </div>
            </div>

            {/* Get Current Location Button */}
            <button
              type="button"
              onClick={getCurrentLocation}
              className="w-full md:w-auto px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!submissionInfo.canSubmit}
            >
              📍 Use Current Location
            </button>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Upload Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={!submissionInfo.canSubmit}
              />
              
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-md h-64 object-cover rounded-xl shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !submissionInfo.canSubmit}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/userdashboard")}
                className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            📝 Reporting Guidelines
          </h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Be specific and accurate in your description</li>
            <li>• Include the exact location of the incident</li>
            <li>• Upload a clear photo if possible</li>
            <li>• You can submit up to 3 incident reports</li>
            <li>• Check your existing reports in the dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}