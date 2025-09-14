'use client';

import { useEffect, useState } from 'react';

type TimeOfDay = 'morning' | 'afternoon' | 'night';

const getTimeOfDay = (): TimeOfDay => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) {
    return 'morning';
  }
  if (currentHour < 18) {
    return 'afternoon';
  }
  return 'night';
};

export function TimeBasedWidget() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  useEffect(() => {
    setTimeOfDay(getTimeOfDay());
  }, []);

  const renderMorningScene = () => (
    <div className="relative w-full h-32 bg-gradient-to-r from-blue-200 via-yellow-100 to-blue-200 rounded-lg overflow-hidden">
      {/* Sol */}
      <div className="absolute top-2 right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse">
        <div className="absolute inset-0 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
      </div>
      
      {/* Nuvens */}
      <div className="absolute top-3 left-8 w-6 h-3 bg-white rounded-full opacity-80"></div>
      <div className="absolute top-4 left-6 w-4 h-2 bg-white rounded-full opacity-60"></div>
      <div className="absolute top-3 right-12 w-5 h-2 bg-white rounded-full opacity-70"></div>
      
      {/* Coelhinho acordando */}
      <div className="absolute bottom-4 left-6 transform">
        {/* Corpo do coelhinho */}
        <div className="relative">
          {/* Orelhas */}
          <div className="absolute -top-4 left-1 w-2 h-6 bg-gray-300 rounded-full transform rotate-12 animate-bounce"></div>
          <div className="absolute -top-4 left-3 w-2 h-6 bg-gray-300 rounded-full transform -rotate-12 animate-bounce" style={{animationDelay: '0.2s'}}></div>
          
          {/* Cabeça */}
          <div className="w-8 h-6 bg-gray-200 rounded-full relative">
            {/* Olhos */}
            <div className="absolute top-2 left-1.5 w-1 h-1 bg-black rounded-full animate-pulse"></div>
            <div className="absolute top-2 right-1.5 w-1 h-1 bg-black rounded-full animate-pulse"></div>
            
            {/* Nariz */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-pink-400 rounded-full"></div>
          </div>
          
          {/* Corpo */}
          <div className="w-6 h-8 bg-gray-200 rounded-full mt-1"></div>
          
          {/* Patas */}
          <div className="absolute bottom-0 left-0 w-2 h-3 bg-gray-300 rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-2 h-3 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Efeito de despertar */}
        <div className="absolute -top-2 -right-2 text-xs animate-bounce">💤</div>
      </div>
      
      {/* Grama */}
      <div className="absolute bottom-0 left-0 w-full h-3 bg-green-300 rounded-b-lg"></div>
      <div className="absolute bottom-1 left-2 w-1 h-2 bg-green-400"></div>
      <div className="absolute bottom-1 left-4 w-1 h-1 bg-green-400"></div>
      <div className="absolute bottom-1 right-6 w-1 h-2 bg-green-400"></div>
    </div>
  );

  const renderAfternoonScene = () => (
    <div className="relative w-full h-32 bg-gradient-to-r from-orange-200 via-yellow-200 to-orange-200 rounded-lg overflow-hidden">
      {/* Sol pleno */}
      <div className="absolute top-2 right-6 w-10 h-10 bg-yellow-500 rounded-full">
        <div className="absolute inset-1 bg-yellow-400 rounded-full animate-pulse"></div>
        {/* Raios de sol */}
        <div className="absolute -top-2 left-1/2 w-0.5 h-4 bg-yellow-400 transform -translate-x-1/2"></div>
        <div className="absolute -bottom-2 left-1/2 w-0.5 h-4 bg-yellow-400 transform -translate-x-1/2"></div>
        <div className="absolute top-1/2 -left-2 w-4 h-0.5 bg-yellow-400 transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-yellow-400 transform -translate-y-1/2"></div>
      </div>
      
      {/* Passarinho de óculos */}
      <div className="absolute bottom-6 left-8 transform">
        {/* Corpo do passarinho */}
        <div className="relative">
          {/* Cabeça */}
          <div className="w-6 h-5 bg-blue-400 rounded-full relative">
            {/* Óculos */}
            <div className="absolute top-1 left-0.5 w-5 h-3 border-2 border-black rounded-lg bg-transparent">
              <div className="absolute top-0 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
              <div className="absolute top-0 right-1 w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
            </div>
            
            {/* Bico */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full"></div>
          </div>
          
          {/* Corpo */}
          <div className="w-5 h-6 bg-blue-300 rounded-full mt-1"></div>
          
          {/* Asa animada */}
          <div className="absolute top-2 right-0 w-3 h-4 bg-blue-500 rounded-full transform origin-left animate-pulse"></div>
          
          {/* Patas */}
          <div className="absolute bottom-0 left-1 w-0.5 h-2 bg-orange-400"></div>
          <div className="absolute bottom-0 right-1 w-0.5 h-2 bg-orange-400"></div>
        </div>
        
        {/* Copo de suco */}
        <div className="absolute -right-4 bottom-2">
          <div className="w-3 h-4 bg-orange-300 rounded-b-lg border border-orange-400"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"></div>
          {/* Canudo */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-red-400"></div>
        </div>
      </div>
      
      {/* Mesa/base */}
      <div className="absolute bottom-0 left-0 w-full h-4 bg-amber-200 rounded-b-lg"></div>
    </div>
  );

  const renderNightScene = () => (
    <div className="relative w-full h-32 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-lg overflow-hidden">
      {/* Lua */}
      <div className="absolute top-3 right-8 w-8 h-8 bg-gray-100 rounded-full relative">
        <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-gray-300 rounded-full opacity-60"></div>
        <div className="absolute bottom-2 right-1.5 w-1 h-1 bg-gray-300 rounded-full opacity-40"></div>
        {/* Brilho da lua */}
        <div className="absolute inset-0 bg-gray-50 rounded-full animate-pulse opacity-30"></div>
      </div>
      
      {/* Estrelas */}
      <div className="absolute top-4 left-6 w-1 h-1 bg-white rounded-full animate-pulse"></div>
      <div className="absolute top-6 left-12 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-2 left-16 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-8 right-12 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
      
      {/* Tartaruga dormindo */}
      <div className="absolute bottom-4 left-10 transform">
        {/* Corpo da tartaruga */}
        <div className="relative">
          {/* Casco */}
          <div className="w-10 h-6 bg-green-600 rounded-full relative">
            {/* Padrão do casco */}
            <div className="absolute top-1 left-2 w-2 h-2 bg-green-700 rounded-full"></div>
            <div className="absolute top-1 right-2 w-2 h-2 bg-green-700 rounded-full"></div>
            <div className="absolute bottom-1 left-3 w-2 h-1.5 bg-green-700 rounded-full"></div>
          </div>
          
          {/* Cabeça dormindo */}
          <div className="absolute -left-2 top-2 w-4 h-3 bg-green-500 rounded-full">
            {/* Olhos fechados */}
            <div className="absolute top-1 left-1 w-1 h-0.5 bg-black rounded-full"></div>
            <div className="absolute top-1 right-1 w-1 h-0.5 bg-black rounded-full"></div>
          </div>
          
          {/* Patas */}
          <div className="absolute -left-1 bottom-0 w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="absolute -right-1 bottom-0 w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
        
        {/* ZZZ do sono */}
        <div className="absolute -top-4 -right-2 text-white opacity-75 animate-bounce">
          <span className="text-xs">Z</span>
          <span className="text-sm ml-1" style={{animationDelay: '0.5s'}}>Z</span>
          <span className="text-base ml-1" style={{animationDelay: '1s'}}>Z</span>
        </div>
      </div>
      
      {/* Água/lago */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-900 rounded-b-lg opacity-60"></div>
      <div className="absolute bottom-1 left-4 w-2 h-0.5 bg-blue-700 rounded-full opacity-40 animate-pulse"></div>
      <div className="absolute bottom-1 right-8 w-1 h-0.5 bg-blue-700 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
    </div>
  );

  const renderScene = () => {
    switch (timeOfDay) {
      case 'morning':
        return renderMorningScene();
      case 'afternoon':
        return renderAfternoonScene();
      case 'night':
        return renderNightScene();
      default:
        return renderMorningScene();
    }
  };

  const getTitle = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'Bom dia!';
      case 'afternoon':
        return 'Boa tarde!';
      case 'night':
        return 'Boa noite!';
      default:
        return 'Olá!';
    }
  };

  const getDescription = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'Um novo dia cheio de possibilidades! Aqui está um resumo do seu dia.';
      case 'afternoon':
        return 'Hora de relaxar e aproveitar o sol! Aqui está um resumo do seu dia.';
      case 'night':
        return 'Descanse bem e tenha bons sonhos! Aqui está um resumo do seu dia.';
      default:
        return 'Tenha um ótimo dia! Aqui está um resumo do seu dia.';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{getTitle()}</h1>
        <p className="text-muted-foreground">{getDescription()}</p>
      </div>
      
      {renderScene()}
    </div>
  );
}