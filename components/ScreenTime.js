import { StyleSheet, Text, View, KeyboardAvoidingView,Keyboard,Image, TouchableWithoutFeedback,Platform,FlatList, Pressable, TextInput, Dimensions } from 'react-native'
import React, { useEffect, useState, useCallback,useRef,useMemo } from 'react'
import appData from '../AppList.json';
import AntDesign from '@expo/vector-icons/AntDesign';
import CircularProgress from 'react-native-circular-progress-indicator';
import Entypo from '@expo/vector-icons/Entypo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetFlatList,BottomSheetView,BottomSheetScrollView } from "@gorhom/bottom-sheet";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const ScreenTime = ({hours,minutes,displayScreenTime,setDisplayScreenTime}) => {
    const screenTimeText = `${hours}h ${minutes}m`
    const totalMinutes = ((hours*60) + minutes);
    const bottomSheetRef = useRef(null);
    const screenHeight = Dimensions.get('window').height;

    const snapPoints = useMemo(() => [screenHeight*0.4, screenHeight*0.6, screenHeight*0.9], []);

    const [value,setValue] = useState(0);
    const [circleTextColour,setCircleTextColour] = useState("");
    const [outerCircleColour,setOuterCircleColour] = useState("");
    const [innerCircleColour,setInnerCircleColour] = useState("");
    const [expanded, setExpanded] = useState(false);

    const [inputHours,setInputHours] = useState(0);
    const [inputMinutes,setInputMinutes] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredApps, setFilteredApps] = useState(appData);

    const circleColours = [
        {
            text: '#00A0F0',
            outerCircleColour: '#52C5FF',
            innerCircleColour: '#00AAFF',
        },
        {
            text: '#D1D100',
            outerCircleColour: '#FFFF92',
            innerCircleColour: '#FFFF00',
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

    useEffect(()=>{
        let h = Number(hours);
        let m = Number(minutes);  

        let selectedColours;
        let time = hours>12 ? totalMinutes*10/1440 : (hours>8 ? totalMinutes*10/720 : totalMinutes*10/480);
        setValue(time);

        if(h>=8){
            selectedColours = circleColours[4];
        }
        else if(h<8 && h>=6){
            selectedColours = circleColours[3];
        }
        else if(h<6 && h>=4){
            selectedColours = circleColours[2];
        }
        else if(h<4 && h>=2){
            selectedColours = circleColours[1];
        }
        else{
            selectedColours = circleColours[0];
        }
        setCircleTextColour(selectedColours["text"])
        setInnerCircleColour(selectedColours["innerCircleColour"])
        setOuterCircleColour(selectedColours["outerCircleColour"])

    },[totalMinutes,displayScreenTime])

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
        // console.log("handleSheetChange", index);
    }, []);
    const handleSnapPress = useCallback((index) => {
        bottomSheetRef.current?.snapToIndex(index);
    }, []);

    const AppItem = React.memo(({ item }) => (
        <View style={styles.appItem}>
            <View style={{display: 'flex',flexDirection: 'row',alignItems: 'center',maxWidth: '70%'}}>
                <Image
                    source={{ uri: item.appIconUrl }}
                    style={{ width: 35, height: 35, marginRight: 15, borderRadius: 10 }}
                    resizeMode="contain"
                />
                <Text
                    style={styles.appName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {item.appName}
                </Text>
            </View>
            <AntDesign name="pluscircle" size={24} color="#404040" />
        </View>
    ));

    const renderItem = ({ item }) => <AppItem item={item} />;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                {
                    circleTextColour!=undefined && outerCircleColour!=undefined && innerCircleColour!=undefined
                    ?
                    <View style={styles.screenTimeContainer}>
                        <GestureHandlerRootView style={{ flex: 1,height: '100%', width: '100%'}}>
                            <View style={{padding: 20}}>
                                <View style={styles.header}>
                                    <Pressable onPress={() => {
                                        setDisplayScreenTime(false)
                                    }}>
                                        <AntDesign name="arrowleft" size={24} color="black" />
                                    </Pressable>
                                    <Text style={styles.screenTimeText}>Screen Time</Text>
                                </View>
                                <View style={styles.progressCircleContainer}>
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
                                        titleStyle={{fontFamily: 'MontserratMedium'}}
                                    />
                                    <Pressable onPress={() => handleSnapPress(2)} style={styles.logTimePressable}>
                                        <Text style={{fontFamily: 'MontserratMedium',}}>Log App Time</Text>
                                        <Entypo name="plus" size={25} color="black" />
                                    </Pressable>
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
                                            <Text style={{ fontFamily: 'MontserratSemiBold', fontSize: 20, marginLeft: 20}}>
                                                App Time
                                            </Text>
                                        </View>
                                        <View style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Pressable
                                                style={styles.selectAppBox}
                                                onPress={() => {
                                                    setExpanded(true)
                                                }}
                                            >
                                                <Text style={styles.inputText}>Select App</Text>
                                                <Entypo name="plus" size={25} color="black" />
                                            </Pressable>
                                        </View>
                                        <Pressable
                                            style={[
                                                styles.logBtn,
                                                expanded
                                                    ? {}
                                                    : { backgroundColor: '#f5f4f4' },
                                            ]}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily: 'MontserratSemiBold',
                                                    color: expanded ? '#fff' : '#CFCFCF',
                                                }}
                                            >
                                                Log
                                            </Text>
                                        </Pressable>
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
                                        <BottomSheetFlatList
                                            data={filteredApps}
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
        fontFamily: 'MontserratMedium',
        color: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
    },
    screenTimeContainer: {
        width: '100%',
        height: '100%',
        padding: 15,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative'
    },
    progressCircleContainer: {
        display: 'flex',
        height: '100%',
        justifyContent: 'space-around',
        width: '100%',
        alignItems: 'center'
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
        justifyContent: 'center'
    },
    selectAppBox: {
        marginTop: 30,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        padding: 20,
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
        marginTop: 20,
        width: '80%'
    },
    inputRowComponent: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },  
    input: {
        height: 50,
        width: 50,
        backgroundColor: '#F5F4F4',
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'MontserratMedium',
        color: '#000',
        borderRadius: 5,
        marginRight: 20,
    },
    inputText: {
        fontSize: 15,
        fontFamily: 'MontserratMedium',
        color: '#404040',
    },
    logBtn: {
        backgroundColor: '#000',
        width: '80%',
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
        padding: 20,
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
        justifyContent: 'space-between'
    },
    appName: {
        fontSize: 14,
        fontFamily: 'MontserratMedium',
    },
})