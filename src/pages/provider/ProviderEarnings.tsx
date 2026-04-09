
import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProviderEarnings = () => {
  // Mock data for earnings
  const weeklyData = [
    { name: 'Mon', earnings: 80 },
    { name: 'Tue', earnings: 120 },
    { name: 'Wed', earnings: 60 },
    { name: 'Thu', earnings: 100 },
    { name: 'Fri', earnings: 140 },
    { name: 'Sat', earnings: 180 },
    { name: 'Sun', earnings: 90 },
  ];

  const monthlyData = [
    { name: 'Week 1', earnings: 450 },
    { name: 'Week 2', earnings: 380 },
    { name: 'Week 3', earnings: 520 },
    { name: 'Week 4', earnings: 470 },
  ];

  // Mock transactions
  const transactions = [
    { id: 'txn-1', customer: 'Alex Johnson', service: 'Driver Service', date: '08 Apr 2025', amount: '$45' },
    { id: 'txn-2', customer: 'Emma Wilson', service: 'Driver Service', date: '07 Apr 2025', amount: '$60' },
    { id: 'txn-3', customer: 'Michael Brown', service: 'Driver Service', date: '05 Apr 2025', amount: '$55' },
    { id: 'txn-4', customer: 'Sophia Garcia', service: 'Driver Service', date: '03 Apr 2025', amount: '$40' },
  ];

  return (
    <DashboardLayout userType="provider">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Earnings</h1>
          <p className="text-gray-600">Track your earnings and financial metrics</p>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Today's Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$90</div>
              <p className="text-xs text-green-600">+15% from yesterday</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Weekly Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$320</div>
              <p className="text-xs text-green-600">+8% from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Monthly Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,820</div>
              <p className="text-xs text-green-600">+12% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly">
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly" className="mt-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                      <Line type="monotone" dataKey="earnings" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="monthly" className="mt-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                      <Line type="monotone" dataKey="earnings" stroke="#82ca9d" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {transactions.map((txn) => (
                <div key={txn.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{txn.customer}</p>
                    <p className="text-sm text-gray-500">{txn.service} · {txn.date}</p>
                  </div>
                  <div className="text-lg font-bold">{txn.amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProviderEarnings;
