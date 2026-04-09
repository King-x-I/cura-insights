import React from "react";

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">About Cura</h1>
        <p className="mb-4">
          Cura is a leading service-based platform connecting customers with verified professionals 
          for a wide range of household and personal services.
        </p>
        <p className="mb-4">
          Our mission is to make accessing quality services simple, reliable, and accessible to everyone.
          With Cura, you can find trusted professionals for all your needs, from drivers and nannies
          to chefs and caretakers.
        </p>
        <p>
          Founded in 2023, we've quickly grown to become one of the most trusted service platforms
          in the region, with operations across multiple cities.
        </p>
      </main>
    </div>
  );
};

export default AboutPage;
