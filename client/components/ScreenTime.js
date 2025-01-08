import { StyleSheet, Text, View, KeyboardAvoidingView,Keyboard,Image,Animated,TouchableOpacity,Vibration, TouchableWithoutFeedback,Platform,FlatList, Pressable, TextInput, Dimensions } from 'react-native'
import React, { useEffect, useState, useCallback,useRef,useMemo } from 'react'
import appData from '../AppList.json';
import AntDesign from '@expo/vector-icons/AntDesign';
import CircularProgress from 'react-native-circular-progress-indicator';
import Entypo from '@expo/vector-icons/Entypo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetFlatList,BottomSheetView,BottomSheetModal,BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native'; 

const ScreenTime = ({hours,minutes,date,displayScreenTime,setDisplayScreenTime,setIsNavbarVisible}) => {
    const navigation = useNavigation(); 
    const screenTimeText = `${hours}h ${minutes}m`
    const totalMinutes = ((Number(hours)*60) + Number(minutes));
    const bottomSheetRef = useRef(null);
    const screenHeight = Dimensions.get('window').height;

    const { submitScreentime,fetchUserDetails } = useAuth();

    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const snapPoints = useMemo(() => [screenHeight*0.4, screenHeight*0.6, screenHeight*0.9], []);

    const [value,setValue] = useState(0);
    const [circleTextColour,setCircleTextColour] = useState("");
    const [outerCircleColour,setOuterCircleColour] = useState("");
    const [innerCircleColour,setInnerCircleColour] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [loggedApps,setLoggedApps] = useState(false);

    const [selectedApps, setSelectedApps] = useState([]);
    const [showError, setShowError] = useState(false);
    const errorOpacity = useRef(new Animated.Value(0)).current;

    const [inputValues, setInputValues] = useState({}); 

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredApps, setFilteredApps] = useState(appData);

    const circleColours = [
        {
            text: '#00A0F0',
            outerCircleColour: '#52C5FF',
            innerCircleColour: '#00AAFF',
        },
        {
            text: '#CE8D01',
            outerCircleColour: '#FFD06A',
            innerCircleColour: '#FFAE00',
        },
        {
            text: '#E70000',
            outerCircleColour: '#FF7171',
            innerCircleColour: '#FF0000',
        },
        {
            text: '#B20000',
            outerCircleColour: '#B44545',
            innerCircleColour: '#B20000',
        },
    ]

    const combinedData = [
        ...selectedApps,
        ...filteredApps.filter((app) => !selectedApps.some((selected) => selected.id === app.id)),
    ];

    useEffect(()=>{
        let h = Number(hours);
        let m = Number(minutes);  

        let selectedColours;
        let time = hours>12 ? totalMinutes*10/1440 : (hours>8 ? totalMinutes*10/720 : totalMinutes*10/480);
        setValue(time);

        selectedColours = returnCircleColours(h);
        
        setCircleTextColour(selectedColours["text"])
        setInnerCircleColour(selectedColours["innerCircleColour"])
        setOuterCircleColour(selectedColours["outerCircleColour"])

    },[totalMinutes,displayScreenTime])

    const returnCircleColours = (hour) => {
        if(hour>=6){
            return circleColours[3];
        }
        else if(hour<6 && hour>=4){
            return circleColours[2];
        }
        else if(hour<4 && hour>=2){
            return circleColours[1];
        }
        else{
            return circleColours[0];
        }
    }

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query === '') {
            setFilteredApps(appData);
        } else {
            const filtered = appData.filter((app) =>
                app.appName.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredApps(filtered);
        }
    };

    // callbacks
    const handleSheetChanges = useCallback((index) => {
        if(index==-1){
            setIsNavbarVisible(true);
            setIsBottomSheetOpen(false);
        }
    }, []);

    const handleSnapPress = useCallback((index) => {
        bottomSheetRef.current?.snapToIndex(index);
    }, []);

    const handleClosePress = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const handleSelect = (app) => {
        setSelectedApps((prevSelected) => {
            if (prevSelected.find((selected) => selected.id === app.id)) {
                // Deselect the app
                return prevSelected.filter((selected) => selected.id !== app.id);
            } else if (prevSelected.length < 3) {
                // Select the app if the limit isn't reached
                return [app, ...prevSelected];
            } else {
                // Trigger error if trying to select more than 3
                triggerError();
                return prevSelected;
            }
        });
    };

    const triggerError = () => {
        Vibration.vibrate(300); // Trigger vibration
        Animated.sequence([
            Animated.timing(errorOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(errorOpacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleInputChange = (id, field, value) => {
        setInputValues((prevValues) => ({
            ...prevValues,
            [id]: {
                ...prevValues[id],
                [field]: value,
            },
        }));
    };

    const AppItem = React.memo(({ item, onPress, isSelected }) => {
        const animatedScale = new Animated.Value(1);
    
        // Animation when the app is tapped
        const animateSelection = () => {
            Animated.sequence([
                Animated.timing(animatedScale, {
                    toValue: 1.1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedScale, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        };
    
        const handlePress = () => {
            animateSelection();
            onPress(item);
        };
    
        return (
            <TouchableOpacity onPress={handlePress}>
                <Animated.View style={[styles.appItem, { transform: [{ scale: animatedScale }], backgroundColor: isSelected ? '#f6f6f7' : '#fff' }]}>
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            maxWidth: '70%',
                        }}
                    >
                        <Image
                            source={{ uri: item.appIconUrl }}
                            style={{ width: 35, height: 35, marginRight: 15, borderRadius: 10 }}
                            resizeMode="contain"
                        />
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'OutfitRegular',}}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.appName}
                        </Text>
                    </View>
                    <AntDesign
                        name={isSelected ? "closecircle" : "pluscircle"}
                        size={24}
                        color={isSelected ? "#000" : "#404040"}
                    />
                </Animated.View>
            </TouchableOpacity>
        );
    });

    const renderItem = ({ item }) => {
        const isSelected = selectedApps.some((selected) => selected.id === item.id);
        const isSelectionDisabled = selectedApps.length >= 3 && !isSelected;
        return (
            <AppItem
                item={item}
                onPress={handleSelect}
                isSelected={isSelected}
                disabled={isSelectionDisabled}
            />
        );
    };

    // check if hours and minutes field is not empty for an record
    const isValidAppTime = () => {
        let flag = true;
        let keys = Object.keys(inputValues);

        if(keys.length>0){
            keys.map(key => {
                if((inputValues[key]["hours"]==undefined || inputValues[key]["hours"]=="") || inputValues[key]["minutes"]==undefined || inputValues[key]["minutes"]==""){
                    flag = false;
                }
            })
        }

        return keys.length==selectedApps.length && flag;
    };

    const handleSubmit = async () => {
        const screentimeData = {
            totalScreentime: totalMinutes, // Total screen time in minutes
            date: date, // ISO format date
            apps: inputValues
        };
        try {
          const response = await submitScreentime(screentimeData);
          navigation.navigate('Home');
          setSelectedApps([]);
          setLoggedApps(false);
          setInputValues({});
          setDisplayScreenTime(false);


          console.log('Screentime submitted successfully:', response);
        } catch (error) {
          console.error('Error submitting screentime:', error.message);
        }
    };

    const calculateAppPercentages = (inputValues) => {
    const appPercentages = {};
    for (let appId in inputValues) {
        const { hours, minutes } = inputValues[appId];
        const appTimeMinutes = parseInt(hours) * 60 + parseInt(minutes);

        appPercentages[appId] = (appTimeMinutes / totalMinutes) * 100;
    }
    return appPercentages;
    };

    const appPercentages = calculateAppPercentages(inputValues);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <SafeAreaView edges={['right', 'left']} style={{width: '100%',flex:1}}>
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    {
                        circleTextColour!=undefined && outerCircleColour!=undefined && innerCircleColour!=undefined
                        ?
                        <View style={[styles.screenTimeContainer,{position: isBottomSheetOpen ? 'absolute' : 'relative', bottom: isBottomSheetOpen ? -10 : 0}]}>
                            <GestureHandlerRootView style={{ flex: 1,height: '100%', width: '100%'}}>
                                <View style={{padding: 20}}>
                                    <View style={styles.header}>
                                        <Pressable onPress={() => {
                                            setDisplayScreenTime(false)
                                        }}>
                                            <AntDesign name="arrowleft" size={24} color="black" />
                                        </Pressable>
                                        <Text style={styles.screenTimeText}>Screen Time</Text>
                                        {
                                            loggedApps
                                            ?
                                            <Pressable onPress={handleSubmit} style={{backgroundColor: 'black',padding: 10,paddingHorizontal: 15,borderRadius: 20}}>
                                                <Text style={{fontFamily: 'OutfitRegular',color: '#fff',fontSize: 12}}>Save</Text>
                                            </Pressable>
                                            :
                                            <View></View>
                                        }
                                    </View>
                                    <View style={styles.progressCircleContainer}>
                                        {
                                            loggedApps
                                            ?
                                            <View style={{display: 'flex',justifyContent: 'center',alignItems: 'center',position: 'relative',flex: 1}}>
                                                {
                                                    [...selectedApps].sort((a, b) => {
                                                        const appATime =
                                                          parseInt(inputValues[a.id]?.hours || 0) * 60 +
                                                          parseInt(inputValues[a.id]?.minutes || 0);
                                                        const appBTime =
                                                          parseInt(inputValues[b.id]?.hours || 0) * 60 +
                                                          parseInt(inputValues[b.id]?.minutes || 0);
                                                        return appBTime - appATime;
                                                      }).map((app, index) => {
                                                        const appPercentage = appPercentages[app.id] || 0;
                                                        const appTime = inputValues[app.id] || { hours: "0", minutes: "0" };

                                                        let h = Number(appTime.hours);
                                                        let innerCircleColour, outerCircleColour, selectedColours;

                                                        selectedColours = returnCircleColours(h);

                                                        innerCircleColour = selectedColours["innerCircleColour"];
                                                        outerCircleColour = selectedColours["outerCircleColour"];
                                                
                                                        return (
                                                          <View key={app.id} style={[styles.progressContainer, { }]}>
                                                            <CircularProgress
                                                              value={appPercentage}
                                                              title={app.name}
                                                              radius={120 - index * 40} // Decrease radius for each app to stack
                                                              activeStrokeColor={innerCircleColour}
                                                              inActiveStrokeColor={outerCircleColour}
                                                              inActiveStrokeOpacity={0.5}
                                                              inActiveStrokeWidth={40}
                                                              activeStrokeWidth={20}
                                                              showProgressValue={false}
                                                              titleStyle={{ fontFamily: "OutfitRegular" }}
                                                            />
                                                            {/* <View style={{display: 'flex',flexDirection: 'row',justifyContent: 'center',alignItems: 'center'}}>
                                                                <Image
                                                                    source={{ uri: app.appIconUrl }}
                                                                    style={{ width: 30, height: 30, marginRight: 15, borderRadius: 10 }}
                                                                    resizeMode="contain"
                                                                />
                                                                <Text style={{marginRight: 15}}>:</Text>
                                                                <View style={{height: 30,width: 30,backgroundColor: innerCircleColour}}></View>
                                                            </View> */}
                                                          </View>
                                                        );
                                                      })
                                                }
                                            </View>
                                            :
                                            <CircularProgress
                                                value={value}
                                                title={screenTimeText}
                                                radius={120}
                                                titleColor={circleTextColour}
                                                titleFontSize={25}
                                                activeStrokeColor={innerCircleColour}
                                                inActiveStrokeColor={outerCircleColour}
                                                inActiveStrokeOpacity={0.5}
                                                inActiveStrokeWidth={40}
                                                activeStrokeWidth={20}
                                                showProgressValue={false}
                                                titleStyle={{fontFamily: 'OutfitRegular'}}
                                            />
                                        }
                                        <Pressable onPress={() => {
                                            handleSnapPress(2)
                                            setIsNavbarVisible(false)
                                            setIsBottomSheetOpen(true)
                                        }} style={styles.logTimePressable}>
                                            {
                                                !loggedApps
                                                ?
                                                <Text style={{fontFamily: 'OutfitRegular',}}>Log App Time</Text>
                                                :
                                                <Text style={{fontFamily: 'OutfitRegular',}}>Edit App Time</Text>
                                            }
                                            <Entypo name="plus" size={25} color="black" />
                                        </Pressable>

                                        {
                                            loggedApps
                                            ?
                                            <View style={{display: 'flex',flexDirection: 'column'}}>
                                                {
                                                    selectedApps.map(app => {
                                                        let hour = inputValues[app.id].hours;
                                                        let selectedColours = returnCircleColours(hour);
                                                        return(
                                                            <View style={[styles.appItem,{width:'100%'}]} key={app.id}>
                                                                <View
                                                                    style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center',
                                                                        maxWidth:'70%'
                                                                    }}
                                                                >
                                                                    <Image
                                                                        source={{ uri: app.appIconUrl }}
                                                                        style={{ width: 35, height: 35, marginRight: 15, borderRadius: 10 }}
                                                                        resizeMode="contain"
                                                                    />
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 14,
                                                                            fontFamily: 'OutfitRegular',}}
                                                                        numberOfLines={1}
                                                                        ellipsizeMode="tail"
                                                                    >
                                                                        {app.appName}
                                                                    </Text>
                                                                </View>
                                                                <View>
                                                                    <Text style={{fontFamily: 'OutfitMedium',color: selectedColours["innerCircleColour"]}}>{inputValues[app.id].hours}h {inputValues[app.id].minutes}m</Text>
                                                                </View>
                                                            </View>
                                                        )
                                                    })
                                                }
                                            </View>
                                            :
                                            <View></View>

                                        }
                                    </View>
                                </View>
                            
                                <BottomSheet
                                    ref={bottomSheetRef}
                                    onChange={handleSheetChanges}
                                    snapPoints={snapPoints}
                                    style={{width: '100%'}}
                                    index={-1}
                                    enableOverDrag={false} 
                                    simultaneousHandlers={bottomSheetRef} 
                                    enablePanDownToClose={true}
                                >
                                    {
                                        !expanded
                                        ?
                                        <BottomSheetView style={styles.bottomSheetContainer}>
                                            <View style={styles.bottomSheetHeader}>
                                                <FontAwesome6 name="hourglass-empty" size={30} color="black" />
                                                <Text style={{ fontFamily: 'OutfitMedium', fontSize: 20, marginLeft: 20}}>
                                                    App Time
                                                </Text>
                                            </View>
                                            <View style={{ display: 'flex', flexDirection: 'column' }}>
                                                {
                                                    selectedApps.length>0
                                                    ?
                                                    <Pressable
                                                        style={styles.selectAppBox}
                                                        onPress={() => {
                                                            setExpanded(true)
                                                        }}
                                                    >
                                                        <Text style={styles.inputText}>Edit Apps</Text>
                                                        <AntDesign name="edit" size={25} color="black" />
                                                    </Pressable>
                                                    :
                                                    <Pressable
                                                        style={styles.selectAppBox}
                                                        onPress={() => {
                                                            setExpanded(true)
                                                        }}
                                                    >
                                                        <Text style={styles.inputText}>Select Apps</Text>
                                                        <Entypo name="plus" size={25} color="black" />
                                                    </Pressable>
                                                }
                                            </View>
                                            {
                                                selectedApps
                                                ?
                                                selectedApps.map(app => {
                                                    const appValues = inputValues[app.id] || { hours: '', minutes: '' };
                                                    return(
                                                        <View
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                width: '90%',
                                                                borderWidth: 1,
                                                                borderColor: '#f5f4f4',
                                                                padding: 15,
                                                                borderRadius: 10
                                                            }}
                                                            key={app.id}
                                                        >
                                                            <View style={{display: 'flex',flexDirection: 'row',alignItems: 'center'}}>
                                                                <Image
                                                                    source={{ uri: app.appIconUrl }}
                                                                    style={{ width: 40, height: 40, marginRight: 15, borderRadius: 10 }}
                                                                    resizeMode="contain"
                                                                />
                                                                <Text
                                                                    style={{
                                                                        fontSize: 14,
                                                                        fontFamily: 'OutfitRegular',}}
                                                                    numberOfLines={1}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    {app.appName}
                                                                </Text>
                                                            </View>
                                                            <View style={{display: 'flex',flexDirection: 'row',justifyContent: 'space-around',marginTop: 20,}}>
                                                                <View style={styles.inputRow}>
                                                                    <TextInput
                                                                        value={appValues.hours}
                                                                        placeholder="00"
                                                                        onChangeText={(value) => handleInputChange(app.id, 'hours', value)}
                                                                        style={styles.input}
                                                                        keyboardType="numeric"
                                                                        placeholderTextColor="#DDD"
                                                                    />
                                                                    <Text style={styles.inputText}>Hours</Text>
                                                                </View>
                                                                <View style={styles.inputRow}>
                                                                    <TextInput
                                                                        value={appValues.minutes}
                                                                        placeholder="00"
                                                                        onChangeText={(value) => handleInputChange(app.id, 'minutes', value)}
                                                                        style={styles.input}
                                                                        keyboardType="numeric"
                                                                        placeholderTextColor="#DDD"
                                                                    />
                                                                    <Text style={styles.inputText}>Minutes</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    )
                                                })
                                                :
                                                <View></View>
                                            }
                                            {
                                                isValidAppTime()
                                                ?
                                                <Pressable
                                                    style={[
                                                        styles.logBtn,
                                                        { backgroundColor: '#000' },
                                                    ]}
                                                    onPress={()=>{
                                                        handleClosePress()
                                                        setLoggedApps(true);
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontFamily: 'OutfitMedium',
                                                            color: '#fff',
                                                        }}
                                                    >
                                                        Log
                                                    </Text>
                                                </Pressable>
                                                :
                                                <Pressable
                                                    style={[
                                                        styles.logBtn,
                                                        { backgroundColor: '#f5f4f4' },
                                                    ]}
                                                >
                                                    <Text
                                                        style={{
                                                            fontFamily: 'OutfitMedium',
                                                            color: '#CFCFCF',
                                                        }}
                                                    >
                                                        Log
                                                    </Text>
                                                </Pressable>
                                            }
                                            
                                        </BottomSheetView>
                                        :
                                        <BottomSheetView style={styles.bottomSheetContainer}>
                                            <View style={styles.bottomSheetSearchHeader}>
                                                <Pressable
                                                    style={styles.collapseBottomSheet}
                                                    onPress={() => {
                                                        setExpanded(false);
                                                    }}
                                                >
                                                    <AntDesign name="arrowleft" size={25} color="black" />
                                                </Pressable>
                                                <View style={{ position: 'relative', width: '80%' }}>
                                                    <TextInput
                                                        style={styles.searchInput}
                                                        placeholder="Which app are you looking for?"
                                                        placeholderTextColor="#636363"
                                                        value={searchQuery}
                                                        onChangeText={handleSearch}
                                                    />
                                                    <AntDesign
                                                        style={{
                                                            position: 'absolute',
                                                            left: 15,
                                                            top: '50%',
                                                            transform: [{ translateY: -12 }],
                                                        }}
                                                        name="search1"
                                                        size={20}
                                                        color="#636363"
                                                    />
                                                </View>
                                            </View>
                                            {selectedApps.length === 3 && (
                                                <View style={styles.tickContainer}>
                                                    <AntDesign name="checkcircle" size={24} color="black" />
                                                    <Text style={styles.tickText}>Selection Complete!</Text>
                                                </View>
                                            )}
                                            <Animated.Text
                                                style={[
                                                    styles.errorText,
                                                    { opacity: errorOpacity },
                                                ]}
                                            >
                                                You can select up to 3 apps only.
                                            </Animated.Text>
                                            <BottomSheetFlatList
                                                data={combinedData}
                                                keyExtractor={(i) => i.id}
                                                renderItem={renderItem}
                                                keyboardShouldPersistTaps="handled"
                                                nestedScrollEnabled={true}
                                                style={{width: '100%'}}
                                            />
                                        </BottomSheetView>
                                    }
                                </BottomSheet>
                            </GestureHandlerRootView>

                        </View>
                        :
                        <View></View>
                    }
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </KeyboardAvoidingView>
    )
}

export default ScreenTime

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f4f4',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    screenTimeText: {
        fontSize: 20,
        fontFamily: 'OutfitRegular',
        color: '#000',
        display: 'flex',
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    screenTimeContainer: {
        width: '100%',
        height: '100%',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
    },
    progressCircleContainer: {
        display: 'flex',
        height: '90%',
        justifyContent: 'space-around',
        width: '100%',
        alignItems: 'center',
    },
    logTimePressable: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bottomSheetContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        flex: 1,
    },
    bottomSheetHeader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectAppBox: {
        marginTop: 30,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        padding: 15,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#f5f4f4',
        borderRadius: 10,
    },
    inputRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        
    },
    inputRowComponent: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },  
    input: {
        height: 35,
        width: 35,
        backgroundColor: '#F5F4F4',
        textAlign: 'center',
        fontFamily: 'OutfitRegular',
        color: '#000',
        borderRadius: 5,
        marginRight: 20,
    },
    inputText: {
        fontSize: 13,
        fontFamily: 'OutfitRegular',
        color: '#404040',
    },
    logBtn: {
        backgroundColor: '#000',
        width: '90%',
        padding: 20,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    searchInput: {
        width: '100%',
        padding: 15,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#f5f4f4',
        paddingLeft: 45
    },
    bottomSheetSearchHeader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 20
    },
    collapseBottomSheet: {
        marginRight: 10
    },
    appItem: {
        padding: 15,
        marginTop: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f5f4f4',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        marginLeft: 'auto',
        marginRight: 'auto',
        overflow: 'hidden',
        justifyContent: 'space-between',
        backgroundColor: '#fff'
    },
    errorText: {
        color: '#ff4040',
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 16,
    },
    tickContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tickText: {
        fontSize: 16,
        color: '#4CAF50',
        marginLeft: 10,
    },
    progressContainer: {
        position: "absolute",
        alignItems: "center",
    },
})