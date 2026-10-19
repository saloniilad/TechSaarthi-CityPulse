import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

/* =========================
   🔥 PRIORITY LOGIC
========================= */

const getDynamicEmergencyLevel = (incident) => {
  const emergencyMapping = {
    "Road Damage": 3,
    "Water Leakage": 4,
    "Garbage Overflow": 2,
    "Street Light Issue": 1,
    "Drainage Problem": 4,
    "Electricity Issue": 5,
  };

  let level = emergencyMapping[incident.type] || 1;
  if (incident.reportsCount > 5) level += 1;
  return Math.min(level, 5);
};

const calculatePriority = (incident) => {
  const reportWeight = Math.min(incident.reportsCount * 5, 50);
  const emergencyWeight = incident.emergencyLevel * 6;
  const hoursWaiting =
    (Date.now() - incident.createdAt.getTime()) / (1000 * 60 * 60);
  const waitingWeight = Math.min(hoursWaiting, 20);

  return Math.round(reportWeight + emergencyWeight + waitingWeight);
};

/* =========================
   🧠 UI HELPERS
========================= */

const getStatusColor = (status) => {
  const colors = {
    Open: "bg-red-100 text-red-800",
    Pending: "bg-blue-100 text-blue-800",
    Resolved: "bg-green-100 text-green-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getPriorityBadge = (priority) => {
  if (priority >= 80) return "bg-red-100 text-red-800";
  if (priority >= 60) return "bg-orange-100 text-orange-800";
  if (priority >= 40) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
};

const getPriorityLabel = (priority) => {
  if (priority >= 80) return "Critical";
  if (priority >= 60) return "High";
  if (priority >= 40) return "Medium";
  return "Low";
};

/* =========================
   🚀 COMPONENT
========================= */

const IncidentReportsTable = () => {
  const [incidents, setIncidents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const API_BASE = "http://localhost:3000/api/v1";

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/incidents`);
      setIncidents(res.data.data || []);
    } catch {
      alert("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     🔥 GROUP LOGIC
  ========================= */

  const groupedIncidents = useMemo(() => {
    const map = new Map();
    const statusRank = { Open: 3, Pending: 2, Resolved: 1 };

    incidents.forEach((incident) => {
      const key = `${incident.location.latitude}_${incident.location.longitude}_${incident.department}`;

      if (!map.has(key)) {
        map.set(key, { ...incident, reportsCount: 1 });
      } else {
        const existing = map.get(key);
        existing.reportsCount += 1;

        if (statusRank[incident.status] > statusRank[existing.status]) {
          existing.status = incident.status;
        }
      }
    });

    return Array.from(map.values())
      .map((incident) => {
        const emergencyLevel = getDynamicEmergencyLevel({
          type: incident.category,
          reportsCount: incident.reportsCount,
        });

        return {
          ...incident,
          priority: calculatePriority({
            reportsCount: incident.reportsCount,
            emergencyLevel,
            createdAt: new Date(incident.createdAt),
          }),
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }, [incidents]);

  /* =========================
     👷 ASSIGN STAFF
  ========================= */

const openAssignModal = async (incident) => {
  setSelectedIncident(incident);

  try {
    const res = await axios.get(`${API_BASE}/staff`, {
      params: {
        workCategory: incident.category,
        workLocation: incident.location.address // ✅ matches User schema
      }
    });
    console.log("🔥 STAFF RETURNED BY BACKEND:");
    console.log(res.data.data);

    setStaffList(res.data.data || []);
  } catch (err) {
    console.error(err);
    alert("Failed to fetch staff");
    setStaffList([]);
  }
};




  const assignStaff = async (staffId) => {
    setAssigning(true);
    try {
      await axios.patch(
        `${API_BASE}/incidents/${selectedIncident._id}/assign`,
        { staffId }
      );

      alert("Staff assigned successfully!");
      setSelectedIncident(null);
      fetchIncidents();
    } catch {
      alert("Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  /* =========================
     📊 TABLE
  ========================= */

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Incident Reports</h1>

      <table className="w-full bg-white shadow rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Issue</th>
            <th className="p-3">Reports</th>
            <th className="p-3 text-left">Address</th>
            <th className="p-3">Status</th>
            <th className="p-3">Priority</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {groupedIncidents.map((incident) => (
            <tr key={incident._id} className="border-t">
              <td className="p-3">{incident.title}</td>
              <td className="p-3 text-center">{incident.reportsCount}</td>
              <td className="p-3 text-sm text-gray-700">
                    {incident.location.address}
              </td>



              <td className="p-3 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                    incident.status
                  )}`}
                >
                  {incident.status}
                </span>
              </td>
              <td className="p-3 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${getPriorityBadge(
                    incident.priority
                  )}`}
                >
                  {/* {incident.label incident.priority} */}
                  {getPriorityLabel(incident.priority)} ({incident.priority})


                </span>
              </td>
              <td className="p-3 text-center">
                {incident.status === "Open" && (
                  <button
                    onClick={() => openAssignModal(incident)}
                    className="bg-blue-600 text-white px-4 py-1 rounded"
                  >
                    Assign
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* =========================
           🪟 ASSIGN MODAL
      ========================= */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white w-full max-w-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Assign Staff</h2>

            {staffList.length === 0 ? (
              <p>No staff available</p>
            ) : (
              staffList.map((staff) => (
                <div
                  key={staff._id}
                  className="flex justify-between items-center border p-3 rounded mb-2"
                >
                  <div>
                    <p className="font-semibold">{staff.name}</p>
                    <p className="text-xs text-gray-500">
                      {staff.department}
                    </p>
                  </div>
                  <button
                    disabled={assigning}
                    onClick={() => assignStaff(staff._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Allot
                  </button>
                </div>
              ))
            )}

            <button
              onClick={() => setSelectedIncident(null)}
              className="mt-4 text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReportsTable;
