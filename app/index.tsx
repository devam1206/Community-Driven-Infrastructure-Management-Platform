import React, { useState } from "react";
import { View, Image, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import "C:/Projects/mini project 7/my-app/global.css"
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
// import {
//   Menubar,
//   MenubarContent,
//   MenubarItem,
//   MenubarMenu,
//   MenubarSeparator,
//   MenubarShortcut,
//   MenubarTrigger,
// } from "@/components/ui/menubar"



export default function Index() {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80} // adjust if header present
    >
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 px-4">
        <Button onPress={pickImage}>
        <Text>Upload Image</Text>
        </Button>
        {image && (
          <Image
            source={{ uri: image }}
            className="w-48 h-48 my-4 rounded-lg"
          />
        )}
        {/* <TextInput
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
          className="border border-gray-300 p-2 w-full max-w-xs mb-4 rounded-lg"
        /> */}
        <Input
          placeholder="Enter description"
          onChangeText={setDescription}
          value={description}
          className="mb-4"
        />
        <Text className="text-base text-gray-700 dark:text-gray-100">Image Description: {description}</Text>
      </View>
    </KeyboardAvoidingView>
    
  );
}
