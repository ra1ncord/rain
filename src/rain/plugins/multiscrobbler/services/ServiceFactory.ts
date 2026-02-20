import { logger } from "@lib/utils/logger";

import { ServiceClient, ServiceType } from "../defs";
import { currentSettings } from "../storage";
import { LastFmService } from "./LastFmService";
import { LibreFmService } from "./LibreFmService";
import { ListenBrainzService } from "./ListenBrainzService";

export class ServiceFactory {
    private static instance: ServiceFactory;
    private serviceInstances: Map<ServiceType, ServiceClient>;

    private constructor() {
        this.serviceInstances = new Map();
    }

    public static getInstance(): ServiceFactory {
        if (!ServiceFactory.instance) {
            ServiceFactory.instance = new ServiceFactory();
        }
        return ServiceFactory.instance;
    }

    public getService(serviceType?: ServiceType): ServiceClient {
        if (!this.serviceInstances) {
            this.serviceInstances = new Map();
        }

        const type = serviceType || currentSettings.service;

        if (!type) {
            throw new Error(
                "[ServiceFactory] No service type specified and no default service configured",
            );
        }

        if (!this.serviceInstances.has(type)) {
            this.serviceInstances.set(type, this.createService(type));
        }

        return this.serviceInstances.get(type)!;
    }

    public getCurrentService(): ServiceClient {
        return this.getService(currentSettings.service);
    }

    private createService(serviceType: ServiceType): ServiceClient {
        switch (serviceType) {
            case "lastfm":
                return new LastFmService();
            case "librefm":
                return new LibreFmService();
            case "listenbrainz":
                return new ListenBrainzService();
            default:
                throw new Error(
                    `[ServiceFactory] Unknown service type: ${serviceType}`,
                );
        }
    }

    public clearCache(): void {
        if (this.serviceInstances) {
            this.serviceInstances.clear();
        } else {
            this.serviceInstances = new Map();
        }
    }

    public validateCurrentService(): Promise<boolean> {
        return this.getCurrentService().validateCredentials();
    }

    public async testService(serviceType: ServiceType): Promise<boolean> {
        try {
            const service = this.getService(serviceType);
            return service.validateCredentials();
        } catch (error) {
            logger.error(`[ServiceFactory] Failed to test ${serviceType}:`, error);
            return false;
        }
    }

    public getSupportedServices(): ServiceType[] {
        return ["lastfm", "librefm", "listenbrainz"];
    }

    public getServiceDisplayName(serviceType: ServiceType): string {
        const service = this.getService(serviceType);
        return service.getServiceName();
    }
}

export const serviceFactory = ServiceFactory.getInstance();

export const getCurrentService = () => serviceFactory.getCurrentService();
export const getService = (type?: ServiceType) =>
    serviceFactory.getService(type);
export const validateCurrentService = () =>
    serviceFactory.validateCurrentService();
