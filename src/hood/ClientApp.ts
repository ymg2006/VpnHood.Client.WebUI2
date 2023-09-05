import {ClientApiFactory} from "@/hood/ClientApiFactory";
import {
    AppFeatures,
    AppSettings,
    AppState,
    ClientProfileItem,
    ConnectParam,
    LoadAppParam,
    UserSettings
} from "@/hood/VpnHood.Client.Api";
import {ApiClient} from './VpnHood.Client.Api';

const apiClient: ApiClient = ClientApiFactory.instance.ApiClient();

export class ClientApp {

    public state: AppState;
    public features: AppFeatures;
    public settings: AppSettings;
    public clientProfileItems: ClientProfileItem[];

    public constructor(
        apiClient: ApiClient,
        state: AppState,
        features: AppFeatures,
        settings: AppSettings,
        clientProfileItems: ClientProfileItem[]) {
        // Initialize
        this.state = state;
        this.features = features;
        this.settings = settings;
        this.clientProfileItems = clientProfileItems;
    }

    public static async create(): Promise<ClientApp> {
        const result = await apiClient.loadApp(new LoadAppParam({
            withSettings: true,
            withState: true,
            withClientProfileItems: true,
            withFeatures: true,
        }));
        return new ClientApp(apiClient, result.state!, result.features!, result.settings!, result.clientProfileItems!);
    }

    public async loadApp(options?: {
        withSettings?: boolean,
        withState?: boolean,
        withClientProfileItems?: boolean,
        withFeatures?: boolean
    }): Promise<void> {
        const loadApp = await apiClient.loadApp(
            new LoadAppParam({
                withSettings: options?.withSettings ?? false,
                withState: options?.withState ?? false,
                withClientProfileItems: options?.withClientProfileItems ?? false,
                withFeatures: options?.withFeatures ?? false,
            }))

        if (loadApp.features)
            this.features = loadApp.features;

        if (loadApp.state) {
            this.state = loadApp.state;
            this.state.connectionState = loadApp.state.connectionState;
        }
        if (loadApp.settings) {
            this.settings = loadApp.settings;
        }

    }

    public async connect(clientProfileId?: string): Promise<void> {
        if (!clientProfileId)
            await this.loadApp({withSettings: true});

        const defaultClientProfileId = clientProfileId ?? this.settings.userSettings.defaultClientProfileId;
        if (defaultClientProfileId)
            await apiClient.connect(new ConnectParam({clientProfileId: defaultClientProfileId}));

        else throw new Error("Could not found default client profile id");
    }

    public async disconnect(): Promise<void> {
        await apiClient.disconnect();
    }

    public appVersion(isFull: boolean): string {
        return isFull ? this.features?.version : this.features?.version.split(".")[2];
    }

    public async saveUserSetting(userSetting: UserSettings): Promise<void> {
        await apiClient.setUserSettings(userSetting);
    }
}