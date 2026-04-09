import React from "react";

const TermsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="mb-4">
          Welcome to Cura. By accessing our website or services, you agree to these Terms of Service.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-3">1. Service Description</h2>
        <p className="mb-4">
          Cura provides a platform connecting consumers with service providers for various household
          and personal services. We do not directly provide these services but facilitate connections
          between users and verified providers.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-3">2. User Responsibilities</h2>
        <p>
          Users must provide accurate information, treat service providers with respect, and comply
          with all applicable laws and regulations. Users are responsible for evaluating and selecting
          service providers based on their own judgment.
        </p>
      </main>
    </div>
  );
};

export default TermsPage;
